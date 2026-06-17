import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Vues de pubs rewarded (Adsgram, etc.)
  await knex.schema.createTable('ad_views', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.string('ad_id', 100).notNullable();
    table.string('ad_type', 50).notNullable(); // adsgram, telegram_ads
    table.integer('reward_coins').defaultTo(0);
    table.decimal('revenue_usd', 10, 4); // ce qu'on a gagné
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  // Sponsorships (chaînes Telegram qui paient pour apparaître comme quête)
  await knex.schema.createTable('sponsorships', (table) => {
    table.bigIncrements('id').primary();
    table.string('sponsor_name', 255).notNullable();
    table.string('channel_username', 100);
    table.text('channel_url');
    table.decimal('cost_usd', 10, 2);
    table.timestamp('starts_at', { useTz: true });
    table.timestamp('ends_at', { useTz: true });
    table.jsonb('required_actions'); // {subscribe: true, like: true, ...}
    table.integer('reward_coins');
    table.integer('max_completions');
    table.integer('current_completions').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  await knex.schema.raw('CREATE INDEX idx_ad_views_user_id ON ad_views (user_id, created_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ad_views');
  await knex.schema.dropTableIfExists('sponsorships');
}
