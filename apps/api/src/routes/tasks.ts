/**
 * Task routes: /api/tasks/*
 * GET /api/tasks/next - Get next AI task for the user
 * POST /api/tasks/submit - Submit an answer
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { getNextTaskForUser, submitTask } from '../services/task.service';

const tasks = new Hono();

tasks.get('/next', authMiddleware, rateLimit('quest'), async (c) => {
  const user = c.get('telegramUser');
  
  const task = await getNextTaskForUser(user.id);
  
  if (!task) {
    return c.json({ error: 'No tasks available' }, 404);
  }
  
  // Don't leak the correct answer to the client
  const { correct_answer, ...sanitized } = task.payload;
  
  return c.json({
    task: {
      id: task.id,
      type: task.type,
      question: task.question,
      payload: sanitized,
      rewardCoins: task.reward_coins,
      rewardXp: task.reward_xp,
      difficulty: task.difficulty,
    },
  });
});

tasks.post(
  '/submit',
  authMiddleware,
  rateLimit('quest'),
  zValidator('json', z.object({
    taskId: z.number().int().positive(),
    answer: z.any(),
  })),
  async (c) => {
    const user = c.get('telegramUser');
    const { taskId, answer } = c.req.valid('json');
    
    try {
      const result = await submitTask(user.id, taskId, answer);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  },
);

export default tasks;
