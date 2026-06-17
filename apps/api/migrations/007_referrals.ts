import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('referrals', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('referrer_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.bigInteger('referred_id').unsigned().unique().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.boolean('bonus_paid').defaultTo(false);
    table.timestamp('bonus_paid_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('referrals');
}
