/**
 * Knex instance for PostgreSQL.
 * Use this in all services: `import { db } from '@/db/knex'`
 */
import Knex from 'knex';
import { env } from '../lib/env';

export const db = Knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: {
    min: 2,
    max: env.NODE_ENV === 'production' ? 20 : 5,
  },
  // Better stack traces
  asyncStackTraces: env.NODE_ENV !== 'production',
});
