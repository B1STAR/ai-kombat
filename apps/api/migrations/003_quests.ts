import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('quests', (table) => {
    table.increments('id').primary();
    table.string('code', 50).unique().notNullable();
    table.string('name', 100).notNullable();
    table.text('description');
    table.string('type', 50).notNullable(); // daily, weekly, one_time, sponsored
    table.string('category', 50); // training, social, streak, ai_task
    
    table.integer('target_count').defaultTo(1);
    table.string('target_action', 50); // login, tap, complete_ai_task, invite_friend
    
    table.integer('reward_coins').defaultTo(0);
    table.integer('reward_gems').defaultTo(0);
    table.integer('reward_xp').defaultTo(0);
    
    table.integer('min_ai_level').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('expires_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  await knex.schema.createTable('user_quests', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.integer('quest_id').notNullable().references('id').inTable('quests');
    table.integer('progress').defaultTo(0);
    table.boolean('is_completed').defaultTo(false);
    table.timestamp('completed_at', { useTz: true });
    table.timestamp('started_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'quest_id', 'started_at']);
  });
  
  await knex.schema.raw('CREATE INDEX idx_user_quests_user_id ON user_quests (user_id)');
  await knex.schema.raw('CREATE INDEX idx_user_quests_incomplete ON user_quests (user_id, is_completed) WHERE is_completed = FALSE');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_quests');
  await knex.schema.dropTableIfExists('quests');
}
