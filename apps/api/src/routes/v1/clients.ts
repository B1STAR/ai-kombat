/**
 * Client account API: /api/v1/account/*
 * For B2B clients to manage their account and credits
 */
import { Hono } from 'hono';
import { db } from '../../db/knex';

const clients = new Hono();

// Stub: balance, credit, webhook
// In production, this integrates with Stripe for actual payments

clients.get('/balance', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const client = await db('clients').where({ api_key: apiKey }).first();
  if (!client) return c.json({ error: 'Invalid API key' }, 401);
  
  return c.json({
    client_id: client.id,
    name: client.name,
    total_spent_usd: client.total_spent_usd,
    credit_usd: 0, // TODO: implement credit system
  });
});

clients.post('/credit', async (c) => {
  return c.json({
    error: 'Credit system not yet implemented. Contact sales.',
  }, 501);
});

export default clients;
