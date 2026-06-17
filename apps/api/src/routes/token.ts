/**
 * Token routes: /api/token/*
 * Phase 4+ - Stub for now, will be implemented when smart contract is ready
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';

const token = new Hono();

token.get('/balance', authMiddleware, (c) => {
  return c.json({
    balance: 0,
    message: 'Token not yet launched. Coming in Phase 4.',
  });
});

token.post('/convert', authMiddleware, (c) => {
  return c.json({
    error: 'Token conversion not yet available',
  }, 501);
});

token.post('/stake', authMiddleware, (c) => {
  return c.json({
    error: 'Staking not yet available',
  }, 501);
});

token.get('/history', authMiddleware, (c) => {
  return c.json({
    transactions: [],
    message: 'No transactions yet. Token launches in Phase 4.',
  });
});

export default token;
