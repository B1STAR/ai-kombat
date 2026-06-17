/**
 * Anti-cheat middleware: detects suspicious tap patterns.
 * Logs all taps to tap_events table for later analysis.
 */
import type { Context, Next } from 'hono';
import { db } from '../db/knex';
import { logger } from '../lib/logger';

interface TapEvent {
  count: number;
  clientTimestamp: string;
  durationMs?: number;
}

export const detectSuspiciousPattern = async (
  userId: number,
  event: TapEvent,
): Promise<{ suspicious: boolean; reason?: string }> => {
  // 1. Volume check: max 50,000 taps/day
  const todayCount = await db('tap_events')
    .where('user_id', userId)
    .where('server_timestamp', '>=', db.raw("CURRENT_DATE"))
    .sum('count as total')
    .first();
  
  const dailyTotal = Number(todayCount?.total || 0) + event.count;
  if (dailyTotal > 50_000) {
    logger.warn({ userId, dailyTotal }, '🚨 Excessive daily tap volume');
    return { suspicious: true, reason: 'excessive_volume' };
  }
  
  // 2. Pattern check: interval between taps too regular (bot signature)
  const recentTaps = await db('tap_events')
    .where('user_id', userId)
    .orderBy('server_timestamp', 'desc')
    .limit(10);
  
  if (recentTaps.length >= 5) {
    const intervals: number[] = [];
    for (let i = 0; i < recentTaps.length - 1; i++) {
      const t1 = new Date(recentTaps[i].server_timestamp).getTime();
      const t2 = new Date(recentTaps[i + 1].server_timestamp).getTime();
      intervals.push(t1 - t2);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // If standard deviation is very low (super regular) AND mean is very fast (bot)
    if (stdDev < 20 && mean < 200) {
      logger.warn({ userId, mean, stdDev }, '🚨 Suspicious tap pattern (bot-like)');
      return { suspicious: true, reason: 'regular_interval' };
    }
  }
  
  return { suspicious: false };
};

export const logTapEvent = async (
  userId: number,
  event: TapEvent,
  ip: string,
  userAgent: string,
  suspicious: boolean = false,
) => {
  await db('tap_events').insert({
    user_id: userId,
    count: event.count,
    client_timestamp: event.clientTimestamp,
    duration_ms: event.durationMs,
    ip_address: ip,
    user_agent: userAgent,
    suspicious,
  });
};
