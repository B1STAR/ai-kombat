import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('daily_rewards', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.integer('day_number').notNullable();
    table.integer('coins_earned').notNullable();
    table.integer('gems_earned').defaultTo(0);
    table.timestamp('claimed_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  await knex.schema.raw('CREATE INDEX idx_daily_rewards_user_id ON daily_rewards (user_id, claimed_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('daily_rewards');
}
