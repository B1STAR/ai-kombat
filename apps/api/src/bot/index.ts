/**
 * Telegram bot: handles /start, /help, /stats commands
 * Spawns the Mini App with a "Play" button
 */
import { Telegraf, Markup } from 'telegraf';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

// Workaround: Bun freezes error objects, making telegraf's redactToken crash.
// We patch Error.prototype temporarily so the assign silently fails.
function patchBunReadonly() {
  try {
    const proto = Object.getPrototypeOf(new Error());
    const orig = Object.getOwnPropertyDescriptor(proto, 'message');
    if (orig && !orig.writable) {
      Object.defineProperty(proto, 'message', {
        writable: true,
        configurable: true,
        enumerable: false,
        value: orig.value ?? '',
      });
    }
  } catch (_) {
    // ignore – best-effort patch
  }
}

export const startBot = () => {
  patchBunReadonly();

  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  const isProduction = env.NODE_ENV === 'production';
  const webAppUrl = isProduction
    ? env.FRONTEND_URL
    : 'https://your-ngrok-url.ngrok.io'; // TODO: use ngrok in dev

  // /start command - with optional referral code
  bot.start(async (ctx) => {
    const payload = ctx.startPayload || '';
    const isReferral = payload.startsWith('ref_');

    let message = '👋 Bienvenue sur **AI Kombat** !\n\n';
    message += '🧠 Tu vas entraîner ton propre IA. Chaque tap la rend plus intelligente.\n\n';
    message += '🎮 Clique sur **Play** pour commencer.';

    if (isReferral) {
      message = '🎁 Un ami t\'a invité ! Tu commences avec **+500 coins** bonus.\n\n' + message;
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        [Markup.button.webApp('🎮 Play', webAppUrl)],
      ]).resize(),
    });
  });

  // /help command
  bot.help(async (ctx) => {
    await ctx.reply(
      '🤖 **AI Kombat - Aide**\n\n' +
      '**Commandes:**\n' +
      '/start - Lancer le jeu\n' +
      '/play - Ouvrir la mini-app\n' +
      '/stats - Voir tes stats\n' +
      '/help - Cette aide\n\n' +
      '**Comment jouer:**\n' +
      '1. Clique sur Play pour ouvrir l\'app\n' +
      '2. Tape sur l\'IA centrale pour gagner des coins\n' +
      '3. Achète des modules pour augmenter tes gains\n' +
      '4. Invite des amis pour des bonus\n\n' +
      '💬 Support: @AIKombatSupport',
      { parse_mode: 'Markdown' },
    );
  });

  // /play command - shortcut to open the app
  bot.command('play', async (ctx) => {
    await ctx.reply('🎮 Ouvre le jeu:', Markup.keyboard([
      [Markup.button.webApp('🎮 Play', webAppUrl)],
    ]).resize());
  });

  // /stats command
  bot.command('stats', async (ctx) => {
    const telegramId = ctx.from.id;
    const { db } = await import('../db/knex');
    const user = await db('users').where({ telegram_id: telegramId }).first();

    if (!user) {
      await ctx.reply('❌ Tu n\'as pas encore de compte. Fais /start pour commencer.');
      return;
    }

    await ctx.reply(
      `📊 **Tes stats**\n\n` +
      `🪙 Coins: **${user.coin_balance.toLocaleString()}**\n` +
      `💎 Gems: **${user.gem_balance}**\n` +
      `🤖 AI Level: **${user.ai_level}** (${user.ai_type})\n` +
      `⚡ Energy: **${user.energy}/${user.max_energy}**\n` +
      `👥 Amis invités: **${user.referral_count}**\n\n` +
      `🎮 Continue de jouer pour gagner plus !`,
      { parse_mode: 'Markdown' },
    );
  });

  // Error handler
  bot.catch((err, ctx) => {
    logger.error({ err, ctx: ctx.update.update_id }, 'Bot error');
  });

  // Launch with allowedUpdates to reduce noise
  bot.launch({ allowedUpdates: ['message', 'callback_query'] }).then(() => {
    logger.info('🤖 Telegram bot started (polling)');
  }).catch((err) => {
    logger.error({ err }, 'Bot launch failed');
  });

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
};
