import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cashouts', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.decimal('aik_amount', 20, 8).notNullable();
    table.decimal('ton_amount', 20, 8);
    table.decimal('eur_amount', 10, 2);
    table.string('tx_hash', 255);
    table.string('wallet_address', 100);
    table.string('kyc_status', 20).defaultTo('pending');
    table.string('kyc_provider', 50);
    table.string('status', 20).defaultTo('pending');
    table.text('failure_reason');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('completed_at', { useTz: true });
  });
  
  await knex.schema.raw('CREATE INDEX idx_cashouts_user_id ON cashouts (user_id, created_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cashouts');
}
