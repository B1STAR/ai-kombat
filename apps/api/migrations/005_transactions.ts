import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.string('type', 50).notNullable(); // tap_earn, module_buy, quest_reward, etc.
    table.string('currency', 10).notNullable(); // coin, gem
    table.bigInteger('amount').notNullable(); // positive = gain, negative = spend
    table.bigInteger('balance_after').notNullable();
    table.string('related_entity_type', 50);
    table.bigInteger('related_entity_id');
    table.jsonb('metadata');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  await knex.schema.raw('CREATE INDEX idx_transactions_user_id ON transactions (user_id, created_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_transactions_created_at ON transactions (created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
