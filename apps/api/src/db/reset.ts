/**
 * ⚠️ DANGER: Drop all tables and re-run migrations + seeds.
 * Usage: `bun run db:reset` (only in development!)
 */
import { db } from './knex';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ REFUSING TO RUN IN PRODUCTION');
    process.exit(1);
  }
  
  console.log('⚠️ Dropping all tables...');
  await db.raw('DROP SCHEMA public CASCADE');
  await db.raw('CREATE SCHEMA public');
  await db.raw('GRANT ALL ON SCHEMA public TO public');
  
  console.log('🔄 Running migrations...');
  await db.migrate.latest();
  
  console.log('🌱 Running seeds...');
  await db.seed.run();
  
  console.log('✅ Reset complete');
  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
