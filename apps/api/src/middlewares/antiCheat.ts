/**
 * Anti-cheat middleware: detects suspicious tap patterns.
 * Logs all taps to tap_events table for later analysis.
 *
 * AUDIT FIX (2026-06-17) — Bug #3:
 * Previous version analyzed server_timestamp stdDev across batched requests.
 * This was structurally broken: since taps arrive in batches (up to 60 taps per
 * request), ALL requests in a session have nearly identical server_timestamps,
 * making the stdDev analysis meaningless.
 *
 * New approach: analyze the CLIENT-DECLARED taps-per-second ratio (count / durationMs)
 * which is available per-request and directly reflects tap speed.
 * Secondary check: compare declared speed across recent events for consistency.
 */
import { db } from '../db/knex';
import { logger } from '../lib/logger';

interface TapEvent {
  count: number;
  clientTimestamp: string;
  durationMs?: number;
}

// Maximum credible human tap speed.
// Studies show elite human tappers peak at ~12-14 taps/sec;
// we flag above 15 to give a margin while still catching bots.
const MAX_HUMAN_TAPS_PER_SECOND = 15;

// Minimum taps-per-second below which a batch is suspiciously slow
// (could indicate a bot sleeping between batches to avoid detection)
// Disabled for now — too many false positives on slow phones.
// const MIN_PLAUSIBLE_TAPS_PER_SECOND = 0.5;

export const detectSuspiciousPattern = async (
  userId: number,
  event: TapEvent,
): Promise<{ suspicious: boolean; reason?: string }> => {

  // ── Check 1: Declared speed (taps/sec) is inhumanly fast
  if (event.durationMs !== undefined && event.durationMs > 0) {
    const tapsPerSecond = (event.count / event.durationMs) * 1000;
    if (tapsPerSecond > MAX_HUMAN_TAPS_PER_SECOND) {
      logger.warn({ userId, tapsPerSecond, count: event.count, durationMs: event.durationMs },
        '🚨 Inhuman tap speed detected');
      return { suspicious: true, reason: 'inhuman_speed' };
    }
  }

  // ── Check 2: Zero durationMs with high count is suspicious (instant batch)
  if (event.durationMs === 0 && event.count > 5) {
    logger.warn({ userId, count: event.count }, '🚨 Zero-duration batch with high count');
    return { suspicious: true, reason: 'zero_duration_batch' };
  }

  // ── Check 3: Daily volume cap (50,000 taps/day)
  const todayCount = await db('tap_events')
    .where('user_id', userId)
    .where('server_timestamp', '>=', db.raw('CURRENT_DATE'))
    .sum('count as total')
    .first();

  const dailyTotal = Number(todayCount?.total || 0) + event.count;
  if (dailyTotal > 50_000) {
    logger.warn({ userId, dailyTotal }, '🚨 Excessive daily tap volume');
    return { suspicious: true, reason: 'excessive_volume' };
  }

  // ── Check 4: Variance analysis across recent events
  // A bot often sends batches with eerily consistent speed across sessions.
  // We look at the last 5 events' declared tps values and check variance.
  if (event.durationMs !== undefined && event.durationMs > 0) {
    const recentEvents = await db('tap_events')
      .where('user_id', userId)
      .whereNotNull('duration_ms')
      .where('duration_ms', '>', 0)
      .orderBy('server_timestamp', 'desc')
      .limit(5)
      .select('count', 'duration_ms');

    if (recentEvents.length >= 4) {
      const speeds = recentEvents.map((e: any) => (e.count / e.duration_ms) * 1000);
      const currentSpeed = (event.count / event.durationMs) * 1000;
      const allSpeeds = [currentSpeed, ...speeds];

      const mean = allSpeeds.reduce((a: number, b: number) => a + b, 0) / allSpeeds.length;
      const variance = allSpeeds.reduce((acc: number, val: number) =>
        acc + Math.pow(val - mean, 2), 0) / allSpeeds.length;
      const stdDev = Math.sqrt(variance);

      // StdDev < 0.3 tps AND speed > 8 tps: robotically consistent fast tapping
      if (stdDev < 0.3 && mean > 8) {
        logger.warn({ userId, mean, stdDev }, '🚨 Robotically consistent tap speed across sessions');
        return { suspicious: true, reason: 'robotic_consistency' };
      }
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
    duration_ms: event.durationMs ?? null,
    ip_address: ip,
    user_agent: userAgent,
    suspicious,
  });
};
