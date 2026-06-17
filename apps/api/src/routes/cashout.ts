/**
 * Cashout routes: /api/cashout/*
 * Phase 4+ - Stub for now
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';

const cashout = new Hono();

cashout.post('/request', authMiddleware, (c) => {
  return c.json({
    error: 'Cashout not yet available. Coming in Phase 4.',
  }, 501);
});

cashout.get('/history', authMiddleware, (c) => {
  return c.json({ cashouts: [] });
});

cashout.get('/limits', authMiddleware, (c) => {
  return c.json({
    monthlyLimitEur: 200,
    usedThisMonth: 0,
    remaining: 200,
    nextReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  });
});

export default cashout;
