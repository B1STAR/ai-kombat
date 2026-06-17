/**
 * Seed the database with initial data (modules, quests, achievements).
 * Usage: `bun run db:seed`
 */
import { db } from './knex';
import { seedAiModules } from '../../seeds/ai_modules';
import { seedQuests } from '../../seeds/quests';
import { seedAchievements } from '../../seeds/achievements';
import { seedAiTasks } from '../../seeds/ai_tasks';

async function main() {
  console.log('🌱 Seeding database...');
  
  await seedAiModules(db);
  await seedQuests(db);
  await seedAchievements(db);
  await seedAiTasks(db);
  
  console.log('✅ Seed completed');
  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
