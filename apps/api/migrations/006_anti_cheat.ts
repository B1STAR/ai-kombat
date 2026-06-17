import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Log de tous les taps pour analyse anti-cheat
  await knex.schema.createTable('tap_events', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.timestamp('client_timestamp', { useTz: true }).notNullable();
    table.timestamp('server_timestamp', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('count').notNullable();
    table.integer('duration_ms');
    table.specificType('ip_address', 'INET');
    table.text('user_agent');
    table.boolean('suspicious').defaultTo(false);
  });
  
  await knex.schema.raw('CREATE INDEX idx_tap_events_user_id ON tap_events (user_id, server_timestamp DESC)');
  await knex.schema.raw('CREATE INDEX idx_tap_events_suspicious ON tap_events (suspicious) WHERE suspicious = TRUE');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tap_events');
}
