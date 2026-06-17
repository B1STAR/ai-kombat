/**
 * Task service: AI tasks (image classification, sentiment, etc.) + B2B datasets.
 */
import { db } from '../db/knex';
import { logger } from '../lib/logger';

// ============================================
// USER TASKS (Phase 1: gamified QCM)
// ============================================
export const getNextTaskForUser = async (userId: number) => {
  // 5% du temps, distribuer un gold standard
  const isGoldStandard = Math.random() < 0.05;
  
  if (isGoldStandard) {
    const goldTask = await db('ai_tasks')
      .where({ is_gold_standard: true, is_active: true })
      .whereNotExists(function() {
        this.select('*').from('user_task_submissions')
          .whereRaw('user_task_submissions.task_id = ai_tasks.id')
          .where('user_id', userId);
      })
      .orderByRaw('RANDOM()')
      .first();
    return goldTask || null;
  }
  
  // Tâche normale
  const task = await db('ai_tasks')
    .where({ is_active: true, is_gold_standard: false })
    .whereNotExists(function() {
      this.select('*').from('user_task_submissions')
        .whereRaw('user_task_submissions.task_id = ai_tasks.id')
        .where('user_id', userId);
    })
    .orderByRaw('RANDOM()')
    .first();
  
  return task || null;
};

export const submitTask = async (
  userId: number,
  taskId: number,
  answer: any,
): Promise<{ isCorrect: boolean; coinsEarned: number; xpEarned: number }> => {
  const task = await db('ai_tasks').where({ id: taskId }).first();
  if (!task) throw new Error('Task not found');
  
  const isCorrect = JSON.stringify(answer) === JSON.stringify(task.payload.correct_answer);
  
  // Si gold standard, mettre à jour le trust score
  if (task.is_gold_standard) {
    await updateTrustScore(userId, isCorrect);
  }
  
  await db('user_task_submissions').insert({
    user_id: userId,
    task_id: taskId,
    answer,
    is_correct: isCorrect,
  });
  
  // Récompense uniquement si correct (ou toujours pour les non-gold)
  const coinsEarned = isCorrect ? task.reward_coins : 0;
  const xpEarned = isCorrect ? task.reward_xp : 0;
  
  if (coinsEarned > 0) {
    await db('users')
      .where({ telegram_id: userId })
      .increment('coin_balance', coinsEarned)
      .increment('total_earned_coins', coinsEarned);
    
    await db('transactions').insert({
      user_id: userId,
      type: 'task_reward',
      currency: 'coin',
      amount: coinsEarned,
      related_entity_type: 'task',
      related_entity_id: taskId,
    });
  }
  
  return { isCorrect, coinsEarned, xpEarned };
};

// ============================================
// TRUST SCORE
// ============================================
const updateTrustScore = async (userId: number, goldStandardPassed: boolean) => {
  const trust = await db('user_trust').where({ user_id: userId }).first();
  
  if (!trust) {
    await db('user_trust').insert({
      user_id: userId,
      trust_score: 50,
      gold_standard_passed: goldStandardPassed ? 1 : 0,
      gold_standard_failed: goldStandardPassed ? 0 : 1,
    });
    return;
  }
  
  if (goldStandardPassed) {
    await db('user_trust')
      .where('user_id', userId)
      .increment('gold_standard_passed', 1)
      .increment('trust_score', 1);
  } else {
    await db('user_trust')
      .where('user_id', userId)
      .increment('gold_standard_failed', 1)
      .decrement('trust_score', 5);
    
    const newFailed = trust.gold_standard_failed + 1;
    const newPassed = trust.gold_standard_passed;
    const total = newFailed + newPassed;
    
    if (total >= 10 && newFailed / total > 0.3) {
      await db('user_trust')
        .where('user_id', userId)
        .update({ is_shadow_banned: true, last_strike_at: new Date() });
      
      logger.warn({ userId }, '🚨 User shadow-banned: high gold standard failure rate');
    }
  }
};

export const canUserDoB2BTasks = async (userId: number): Promise<boolean> => {
  const trust = await db('user_trust').where({ user_id: userId }).first();
  if (!trust) return true;
  return trust.trust_score >= 30 && !trust.is_shadow_banned;
};
