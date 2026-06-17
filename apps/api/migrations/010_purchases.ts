import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('purchases', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.string('product_code', 50).notNullable();
    table.decimal('amount_eur', 10, 2).notNullable();
    table.integer('gems_credited').notNullable();
    table.string('payment_provider', 50);
    table.string('provider_transaction_id', 255);
    table.string('status', 20).defaultTo('pending');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('purchases');
}
