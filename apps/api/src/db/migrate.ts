/**
 * Run all pending migrations.
 * Usage: `bun run db:migrate`
 */
import Knex from 'knex';
import { env } from '../lib/env';

const db = Knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    extension: 'ts',
    loadExtensions: ['.ts', '.js'],
  },
});

async function main() {
  console.log('🔄 Running migrations...');
  const [batchNo, newMigrations] = await db.migrate.latest();
  
  if (newMigrations.length === 0) {
    console.log('✅ Already up to date');
  } else {
    console.log(`✅ Batch ${batchNo} ran ${newMigrations.length} migration(s):`);
    newMigrations.forEach((m: string) => console.log(`  - ${m}`));
  }
  
  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
