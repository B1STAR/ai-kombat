/**
 * B2B Dataset API: /api/v1/datasets/*
 * Used by external clients (companies buying annotation services)
 * Auth: API key in header (X-API-Key)
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/knex';
import { UnauthorizedError } from '../../lib/errors';

const datasets = new Hono();

// ============================================
// API KEY AUTH MIDDLEWARE
// ============================================
const apiKeyAuth = async (c: any, next: any) => {
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) throw new UnauthorizedError('Missing X-API-Key header');
  
  const client = await db('clients').where({ api_key: apiKey, is_active: true }).first();
  if (!client) throw new UnauthorizedError('Invalid API key');
  
  c.set('client', client);
  await next();
};

datasets.use('*', apiKeyAuth);

// ============================================
// CREATE A DATASET JOB
// ============================================
const createJobSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['image_classification', 'sentiment', 'bounding_box', 'ocr_correction', 'chatbot_rating', 'code_review', 'translation_validation', 'audio_transcription']),
  items: z.array(z.object({
    id: z.string(),
    url: z.string().url().optional(),
    payload: z.any(),
  })).min(1).max(1_000_000),
  schema: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
  }),
  quality: z.object({
    votes_per_item: z.number().int().min(1).max(10).default(3),
    min_confidence: z.number().min(0).max(1).default(0.66),
    trusted_workers_only: z.boolean().default(false),
  }).default({}),
  deadline_days: z.number().int().min(1).max(90).default(7),
});

datasets.post('/jobs', zValidator('json', createJobSchema), async (c) => {
  const client = c.get('client');
  const data = c.req.valid('json');
  
  // Calculate cost (rough estimate)
  const costPerItem = 0.005; // $0.005 per item to the player
  const totalCost = data.items.length * costPerItem;
  const ourPrice = totalCost * 2; // 100% markup
  
  // Check client has enough balance
  if (Number(client.total_spent_usd || 0) < ourPrice) {
    return c.json({ 
      error: 'Insufficient balance. Please add credit first.',
      required_usd: ourPrice,
      balance_usd: client.total_spent_usd,
    }, 402);
  }
  
  // Create job
  const jobId = `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  return await db.transaction(async (trx) => {
    await trx('dataset_jobs').insert({
      id: jobId,
      client_id: client.id,
      name: data.name,
      type: data.type,
      schema: data.schema,
      total_items: data.items.length,
      votes_per_item: data.quality.votes_per_item,
      min_confidence: data.quality.min_confidence,
      budget_usd: ourPrice,
      cost_usd: totalCost,
      status: 'pending',
      deadline_at: new Date(Date.now() + data.deadline_days * 24 * 60 * 60 * 1000),
    });
    
    // Insert items in batches of 1000
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
      const batch = data.items.slice(i, i + BATCH_SIZE).map((item) => ({
        job_id: jobId,
        external_id: item.id,
        payload: { url: item.url, ...item.payload },
        status: 'pending',
      }));
      await trx('dataset_items').insert(batch);
    }
    
    return c.json({
      job_id: jobId,
      status: 'pending',
      total_items: data.items.length,
      estimated_cost_usd: ourPrice,
      estimated_completion_days: data.deadline_days,
      tracking_url: `${process.env.FRONTEND_URL}/admin/datasets/${jobId}`,
    }, 201);
  });
});

// ============================================
// GET JOB STATUS
// ============================================
datasets.get('/jobs/:id', async (c) => {
  const client = c.get('client');
  const jobId = c.req.param('id');
  
  const job = await db('dataset_jobs')
    .where({ id: jobId, client_id: client.id })
    .first();
  
  if (!job) return c.json({ error: 'Job not found' }, 404);
  
  return c.json({
    id: job.id,
    name: job.name,
    type: job.type,
    status: job.status,
    progress_percent: job.progress_percent,
    total_items: job.total_items,
    completed_items: job.completed_items,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    deadline_at: job.deadline_at,
  });
});

// ============================================
// GET JOB PROGRESS (real-time)
// ============================================
datasets.get('/jobs/:id/progress', async (c) => {
  const client = c.get('client');
  const jobId = c.req.param('id');
  
  const job = await db('dataset_jobs')
    .where({ id: jobId, client_id: client.id })
    .first();
  
  if (!job) return c.json({ error: 'Job not found' }, 404);
  
  // Live stats
  const stats = await db('dataset_items')
    .where({ job_id: jobId })
    .select('status')
    .count('* as count')
    .groupBy('status');
  
  const breakdown: Record<string, number> = {};
  stats.forEach((s: any) => { breakdown[s.status] = Number(s.count); });
  
  return c.json({
    job_id: jobId,
    status: job.status,
    progress_percent: job.progress_percent,
    breakdown,
    updated_at: new Date().toISOString(),
  });
});

// ============================================
// GET RESULTS (CSV/JSON)
// ============================================
datasets.get('/jobs/:id/results', async (c) => {
  const client = c.get('client');
  const jobId = c.req.param('id');
  const format = c.req.query('format') || 'json';
  
  const job = await db('dataset_jobs')
    .where({ id: jobId, client_id: client.id })
    .first();
  
  if (!job) return c.json({ error: 'Job not found' }, 404);
  if (job.status !== 'completed') {
    return c.json({ error: 'Job not yet completed', status: job.status }, 400);
  }
  
  const items = await db('dataset_items')
    .where({ job_id: jobId, status: 'validated' })
    .select('external_id', 'final_answer', 'confidence', 'votes_count');
  
  if (format === 'csv') {
    // Simple CSV format
    const csv = [
      'external_id,answer,confidence,votes_count',
      ...items.map((i: any) => 
        `${i.external_id},"${JSON.stringify(i.final_answer).replace(/"/g, '""')}",${i.confidence},${i.votes_count}`
      ),
    ].join('\n');
    
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${jobId}.csv"`);
    return c.body(csv);
  }
  
  return c.json({
    job_id: jobId,
    count: items.length,
    results: items,
  });
});

export default datasets;
