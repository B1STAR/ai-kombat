import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Historique de toutes les transactions on-chain
  await knex.schema.createTable('token_transactions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().references('telegram_id').inTable('users');
    table.string('tx_hash', 255).unique();
    table.string('type', 50).notNullable(); // convert, cashout, stake, unstake, reward, burn
    table.decimal('amount', 20, 8).notNullable();
    table.string('from_address', 100);
    table.string('to_address', 100);
    table.string('status', 20).defaultTo('pending');
    table.jsonb('metadata');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  // Staking : le user stake des $AIK pour gagner des rewards
  await knex.schema.createTable('stakes', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 20, 8).notNullable();
    table.timestamp('staked_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('unstaked_at', { useTz: true });
    table.decimal('rewards_earned', 20, 8).defaultTo(0);
    table.boolean('is_active').defaultTo(true);
  });
  
  await knex.schema.raw('CREATE INDEX idx_token_tx_user_id ON token_transactions (user_id, created_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_stakes_user_id ON stakes (user_id, is_active)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stakes');
  await knex.schema.dropTableIfExists('token_transactions');
}
