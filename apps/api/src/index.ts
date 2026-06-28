/**
 * AI Kombat - Backend entry point
 * Bun + Hono + TypeScript
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './lib/env';
import { logger as pinoLogger } from './lib/logger';

// Routes
import authRoutes from './routes/auth';
import tapRoutes from './routes/tap';
import aiRoutes from './routes/ai';
import moduleRoutes from './routes/modules';
import questRoutes from './routes/quests';
import taskRoutes from './routes/tasks';
import referralRoutes from './routes/referral';
import leaderboardRoutes from './routes/leaderboard';
import adRoutes from './routes/ads';
import sponsorshipRoutes from './routes/sponsorships';
import tokenRoutes from './routes/token';
import cashoutRoutes from './routes/cashout';
import avatarRoutes from './routes/avatar';

// B2B API
import b2bRoutes from './routes/v1/datasets';
import clientRoutes from './routes/v1/clients';

// Workers
import { startCrons } from './workers/cron';
import { startBot } from './bot';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.get('/', (c) => c.json({
  status: 'ok',
  name: 'ai-kombat-api',
  version: '0.1.0',
  env: env.NODE_ENV,
}));

app.route('/api/auth', authRoutes);
app.route('/api/tap', tapRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/modules', moduleRoutes);
app.route('/api/quests', questRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/referral', referralRoutes);
app.route('/api/leaderboard', leaderboardRoutes);
app.route('/api/ads', adRoutes);
app.route('/api/sponsorships', sponsorshipRoutes);
app.route('/api/token', tokenRoutes);
app.route('/api/cashout', cashoutRoutes);
app.route('/api/avatar', avatarRoutes); // proxy avatar Telegram

// B2B API
app.route('/api/v1/datasets', b2bRoutes);
app.route('/api/v1/account', clientRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  pinoLogger.error({ err }, 'Unhandled error');
  return c.json({ error: 'Internal server error' }, 500);
});

const port = Number(env.PORT) || 3001;
Bun.serve({ port, fetch: app.fetch });

pinoLogger.info(`🚀 AI Kombat API running on http://localhost:${port}`);
pinoLogger.info(`📱 Frontend URL: ${env.FRONTEND_URL}`);
pinoLogger.info(`🌍 Environment: ${env.NODE_ENV}`);

if (env.NODE_ENV === 'production') {
  startCrons();
  startBot();
}
