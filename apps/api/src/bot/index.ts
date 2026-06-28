/**
 * Telegram bot: handles /start, /help, /stats, /play commands
 *
 * REFERRAL ROBUSTE :
 * Quand un utilisateur clique sur t.me/bot?start=ref_XXXX, Telegram envoie
 * la commande /start avec payload="ref_XXXX" AU BOT avant meme que la mini app
 * s'ouvre. On enregistre immediatement un pending_referral en base.
 * Quand la mini app appelle /api/auth/init, le pending est consomme comme
 * source de verite, independamment de start_param dans initData.
 */
import { Telegraf, Markup } from 'telegraf';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { db } from '../db/knex';

function patchBunReadonly() {
  try {
    const proto = Object.getPrototypeOf(new Error());
    const orig = Object.getOwnPropertyDescriptor(proto, 'message');
    if (orig && !orig.writable) {
      Object.defineProperty(proto, 'message', {
        writable: true, configurable: true, enumerable: false, value: orig.value ?? '',
      });
    }
  } catch (_) {}
}

export const startBot = () => {
  patchBunReadonly();

  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  const isProduction = env.NODE_ENV === 'production';
  const webAppUrl = isProduction
    ? env.FRONTEND_URL
    : 'https://your-ngrok-url.ngrok.io';

  // /start — avec ou sans code referral
  bot.start(async (ctx) => {
    const payload = ctx.startPayload || '';
    const isReferral = payload.startsWith('ref_');
    const newUserId = ctx.from.id;

    // --- ENREGISTREMENT PENDING REFERRAL ---
    if (isReferral) {
      const match = payload.match(/^ref_(\d+)$/);
      if (match) {
        const referrerId = parseInt(match[1], 10);
        if (referrerId !== newUserId) {
          try {
            // Verifie que le parrain existe
            const referrer = await db('users').where({ telegram_id: referrerId }).first();
            if (referrer) {
              // Upsert : si l'utilisateur re-clique sur un lien, on met a jour
              await db('pending_referrals')
                .insert({
                  telegram_id: newUserId,
                  referrer_id: referrerId,
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                })
                .onConflict('telegram_id')
                .merge(['referrer_id', 'expires_at']);
              logger.info({ newUserId, referrerId }, 'pending_referral enregistre');
            } else {
              logger.warn({ referrerId }, 'Parrain introuvable en base, pending_referral ignore');
            }
          } catch (err) {
            logger.error({ err }, 'Erreur enregistrement pending_referral');
          }
        }
      }
    }

    // --- MESSAGE D'ACCUEIL ---
    let message = '\u{1F44B} Bienvenue sur **AI Kombat** !\n\n';
    message += '\u{1F9E0} Tu vas entra\u00eener ton propre IA. Chaque tap la rend plus intelligente.\n\n';
    message += '\u{1F3AE} Clique sur **Play** pour commencer.';

    if (isReferral) {
      message = '\u{1F381} Un ami t\'a invit\u00e9 ! Tu commences avec **+500 coins** bonus.\n\n' + message;
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([[Markup.button.webApp('\u{1F3AE} Play', webAppUrl)]]).resize(),
    });
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      '\u{1F916} **AI Kombat - Aide**\n\n' +
      '**Commandes:**\n/start - Lancer le jeu\n/play - Ouvrir la mini-app\n' +
      '/stats - Voir tes stats\n/help - Cette aide\n\n' +
      '**Comment jouer:**\n1. Clique sur Play pour ouvrir l\'app\n' +
      '2. Tape sur l\'IA centrale pour gagner des coins\n' +
      '3. Ach\u00e8te des modules pour augmenter tes gains\n' +
      '4. Invite des amis pour des bonus\n\n' +
      '\u{1F4AC} Support: @AIKombatSupport',
      { parse_mode: 'Markdown' },
    );
  });

  bot.command('play', async (ctx) => {
    await ctx.reply('\u{1F3AE} Ouvre le jeu:', Markup.keyboard(
      [[Markup.button.webApp('\u{1F3AE} Play', webAppUrl)]]
    ).resize());
  });

  bot.command('stats', async (ctx) => {
    const telegramId = ctx.from.id;
    const user = await db('users').where({ telegram_id: telegramId }).first();
    if (!user) {
      await ctx.reply('\u274C Tu n\'as pas encore de compte. Fais /start pour commencer.');
      return;
    }
    await ctx.reply(
      `\u{1F4CA} **Tes stats**\n\n` +
      `\u{1FA99} Coins: **${Number(user.coin_balance).toLocaleString()}**\n` +
      `\u{1F48E} Gems: **${user.gem_balance}**\n` +
      `\u{1F916} AI Level: **${user.ai_level}** (${user.ai_type})\n` +
      `\u26A1 Energy: **${Math.floor(Number(user.energy))}/${user.max_energy}**\n` +
      `\u{1F465} Amis invit\u00e9s: **${user.referral_count}**\n\n` +
      `\u{1F3AE} Continue de jouer pour gagner plus !`,
      { parse_mode: 'Markdown' },
    );
  });

  bot.catch((err, ctx) => {
    logger.error({ err, updateId: ctx.update.update_id }, 'Bot error');
  });

  bot.launch({ allowedUpdates: ['message', 'callback_query'] }).then(() => {
    logger.info('\u{1F916} Telegram bot started (polling)');
  }).catch((err) => {
    logger.error({ err }, 'Bot launch failed');
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
};
