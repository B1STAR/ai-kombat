/**
 * Knex instance for PostgreSQL.
 * Use this in all services: `import { db } from '@/db/knex'`
 *
 * On force une connexion directe IPv4 à Supabase pour éviter l'erreur
 * "tenant/user postgres.xxx not found" causée par le résolveur IPv6 de Bun
 * qui tombe sur le pooler PgBouncer au lieu du host direct.
 */
import Knex from 'knex';
import { env } from '../lib/env';

// Parse DATABASE_URL pour extraire les composants individuels
// et forcer family:4 (IPv4 uniquement) + SSL
function parseConnectionUrl(url: string) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, '') || 'postgres',
      ssl: { rejectUnauthorized: false },
      // Force IPv4 — évite que Bun/pg résolve vers le pooler PgBouncer IPv6
      family: 4,
    };
  } catch {
    // Fallback si l'URL n'est pas parsable — on la passe telle quelle
    return url;
  }
}

export const db = Knex({
  client: 'pg',
  connection: parseConnectionUrl(env.DATABASE_URL),
  pool: {
    min: 2,
    max: env.NODE_ENV === 'production' ? 20 : 5,
  },
  asyncStackTraces: env.NODE_ENV !== 'production',
});
