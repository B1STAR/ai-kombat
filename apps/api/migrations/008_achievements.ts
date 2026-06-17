import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('achievements', (table) => {
    table.increments('id').primary();
    table.string('code', 50).unique().notNullable();
    table.string('name', 100).notNullable();
    table.text('description');
    table.text('icon_url');
    table.integer('reward_coins').defaultTo(0);
    table.integer('reward_gems').defaultTo(0);
    table.jsonb('criteria').notNullable(); // { type: 'taps', target: 1000 }
  });
  
  await knex.schema.createTable('user_achievements', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.integer('achievement_id').notNullable().references('id').inTable('achievements');
    table.timestamp('unlocked_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'achievement_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_achievements');
  await knex.schema.dropTableIfExists('achievements');
}
