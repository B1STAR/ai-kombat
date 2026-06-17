/**
 * Auth middleware: validates Telegram initData via HMAC-SHA256.
 * This is the FIRST line of defense against impersonation.
 *
 * Frontend sends: Authorization: tma <initData>
 * Backend validates the signature with the bot token.
 */
import type { Context, Next } from 'hono';
import { validate, parse, type InitDataParsed } from '@telegram-apps/init-data-node';
import { env } from '../lib/env';
import { db } from '../db/knex';
import { UnauthorizedError } from '../lib/errors';

declare module 'hono' {
  interface ContextVariableMap {
    telegramUser: {
      id: number;
      firstName: string;
      lastName?: string;
      username?: string;
      photoUrl?: string;
      isPremium?: boolean;
      languageCode?: string;
    };
    dbUser: {
      id: number;
      telegram_id: number;
      coin_balance: number;
      gem_balance: number;
      energy: number;
      max_energy: number;
      ai_level: number;
      ai_xp: number;
      ai_name: string;
      is_banned: boolean;
    };
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('authorization');
  
  if (!authHeader || !authHeader.startsWith('tma ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header. Expected: "tma <initData>"');
  }
  
  const initData = authHeader.substring(4);
  
  try {
    // Validate HMAC signature (CRITICAL: this prevents user impersonation)
    validate(initData, env.TELEGRAM_BOT_TOKEN, { expiresIn: 0 });
    
    // Parse the user data
    const parsed: InitDataParsed = parse(initData);
    
    if (!parsed.user) {
      throw new UnauthorizedError('No user in initData');
    }
    
    // Check if user is banned
    const dbUser = await db('users')
      .where({ telegram_id: parsed.user.id })
      .first();
    
    if (dbUser?.is_banned) {
      throw new UnauthorizedError(`Account banned: ${dbUser.ban_reason || 'violated ToS'}`);
    }
    
    c.set('telegramUser', {
      id: parsed.user.id,
      firstName: parsed.user.firstName,
      lastName: parsed.user.lastName,
      username: parsed.user.username,
      photoUrl: parsed.user.photoUrl,
      isPremium: parsed.user.isPremium,
      languageCode: parsed.user.languageCode,
    });
    
    c.set('dbUser', dbUser);
    
    await next();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError(`Invalid initData: ${error.message}`);
  }
};
