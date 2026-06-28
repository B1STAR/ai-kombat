/**
 * Entry point — Bun + Hono API server.
 * startBot et startCrons wrappés dans try/catch avec exit code non-zero
 * pour que PM2/Fly.io redémarre automatiquement en cas de crash.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { startCrons } from './workers/cron';
import { startBot } from './bot';

import auth from './routes/auth';
import tap from './routes/tap';
import ai from './routes/ai';
import modules from './routes/modules';
import quests from './routes/quests';
import tasks from './routes/tasks';
import referral from './routes/referral';
import leaderboard from './routes/leaderboard';
import ads from './routes/ads';
import cashout from './routes/cashout';
import token from './routes/token';
import v1 from './routes/v1/index';

const app = new Hono();

app.use('*', cors({
  origin: env.ALLOWED_ORIGINS?.split(',') ?? ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('*', honoLogger());

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }));

app.route('/api/auth', auth);
app.route('/api/tap', tap);
app.route('/api/ai', ai);
app.route('/api/modules', modules);
app.route('/api/quests', quests);
app.route('/api/tasks', tasks);
app.route('/api/referral', referral);
app.route('/api/leaderboard', leaderboard);
app.route('/api/ads', ads);
app.route('/api/cashout', cashout);
app.route('/api/token', token);
app.route('/api/v1', v1);

if (env.NODE_ENV === 'production') {
  try {
    startCrons();
    logger.info('✅ Cron jobs started');
  } catch (err) {
    logger.fatal({ err }, '❌ startCrons failed — exiting');
    process.exit(1);
  }

  try {
    startBot();
    logger.info('✅ Telegram bot started');
  } catch (err) {
    logger.fatal({ err }, '❌ startBot failed — exiting');
    process.exit(1);
  }
}

const port = Number(env.PORT ?? 3001);
logger.info(`🚀 Server listening on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
