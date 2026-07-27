/**
 * Anti-cheat middleware: detecte les patterns de taps suspects.
 *
 * CORRECTIONS:
 * - On analyse le rythme des TAPS INDIVIDUELS via count/durationMs
 *   et NON la régularité des appels batch (qui sont forcément réguliers).
 * - Le test stdDev/mean s’applique uniquement si durationMs est fourni
 *   et si count est suffisamment grand pour être significatif.
 * - Seuils assouplis pour éviter les faux positifs sur usage mobile normal.
 */
import { db } from '../db/knex';
import { logger } from '../lib/logger';

interface TapEvent {
  count      : number;
  clientTimestamp: string;
  durationMs?: number;
}

export const detectSuspiciousPattern = async (
  userId: number,
  event : TapEvent,
): Promise<{ suspicious: boolean; reason?: string }> => {

  // --- 1. Volume journalier : max 50 000 taps/jour ---
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

  // --- 2. Vitesse intra-batch : taps/seconde impossibles humainement ---
  // Seul un bot peut dépasser ~20 taps/s de façon soutenue.
  // Un humain rapide fait 8–10 taps/s au maximum.
  if (event.durationMs && event.durationMs > 0 && event.count >= 5) {
    const tapsPerSecond = (event.count / event.durationMs) * 1000;
    if (tapsPerSecond > 25) {
      logger.warn({ userId, tapsPerSecond, count: event.count }, '🚨 Tap rate too high (bot)');
      return { suspicious: true, reason: 'tap_rate_too_high' };
    }
  }

  // --- 3. Analyse inter-batches : régularité suspecte ---
  // On ne regarde que les 20 derniers événements pour ne pas biaiser
  // avec des batches légitimes qui ont une régularité naturelle (~800ms).
  // On ne déclenche ce test que si on a au moins 10 batches consécutifs.
  const recentBatches = await db('tap_events')
    .where('user_id', userId)
    .orderBy('server_timestamp', 'desc')
    .limit(20);

  if (recentBatches.length >= 10) {
    const intervals: number[] = [];
    for (let i = 0; i < recentBatches.length - 1; i++) {
      const t1 = new Date(recentBatches[i].server_timestamp).getTime();
      const t2 = new Date(recentBatches[i + 1].server_timestamp).getTime();
      intervals.push(t1 - t2);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, val) => acc + (val - mean) ** 2, 0) / intervals.length;
    const stdDev   = Math.sqrt(variance);

    // Seuils stricts :
    // - mean < 100ms entre batches : impossible humainement (batch = 800ms min)
    // - stdDev < 10ms ET mean < 300ms : pattern 100% mécanique
    // On ne flag PAS si mean est dans la plage normale (600–900ms)
    if (mean < 100) {
      logger.warn({ userId, mean, stdDev }, '🚨 Batches trop rapprochés (bot)');
      return { suspicious: true, reason: 'batch_interval_too_short' };
    }
    if (stdDev < 10 && mean < 300) {
      logger.warn({ userId, mean, stdDev }, '🚨 Pattern batch mécanique détecté');
      return { suspicious: true, reason: 'mechanical_batch_pattern' };
    }
  }

  return { suspicious: false };
};

export const logTapEvent = async (
  userId   : number,
  event    : TapEvent,
  ip       : string | null,
  userAgent: string | null,
  suspicious: boolean = false,
) => {
  try {
    await db('tap_events').insert({
      user_id         : userId,
      count           : event.count,
      client_timestamp: event.clientTimestamp,
      duration_ms     : event.durationMs ?? null,
      ip_address      : ip,
      user_agent      : userAgent,
      suspicious,
    });
  } catch (err) {
    // Ne jamais laisser un échec de log bloquer le tap
    logger.error({ err, userId }, 'logTapEvent insert failed');
  }
};
