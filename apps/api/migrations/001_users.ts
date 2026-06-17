import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('telegram_id').unsigned().unique().notNullable();
    table.string('first_name').notNullable();
    table.string('last_name');
    table.string('username');
    table.text('photo_url');
    table.string('language_code', 10).defaultTo('en');
    table.boolean('is_premium').defaultTo(false);
    
    // Économie
    table.bigInteger('coin_balance').defaultTo(0);
    table.integer('gem_balance').defaultTo(0);
    
    // Énergie
    table.integer('energy').defaultTo(1000);
    table.integer('max_energy').defaultTo(1500);
    table.timestamp('last_energy_update', { useTz: true }).defaultTo(knex.fn.now());
    
    // IA personnelle
    table.string('ai_name', 50).defaultTo('My AI');
    table.integer('ai_level').defaultTo(0);
    table.integer('ai_xp').defaultTo(0);
    table.string('ai_type', 50).defaultTo('novice');
    
    // Stats
    table.bigInteger('total_taps').defaultTo(0);
    table.bigInteger('total_earned_coins').defaultTo(0);
    table.timestamp('last_active_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Referral
    table.bigInteger('referred_by').unsigned().references('id').inTable('users');
    table.integer('referral_count').defaultTo(0);
    
    // Streak
    table.integer('daily_streak').defaultTo(0);
    table.timestamp('last_daily_claim', { useTz: true });
    
    // Meta
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.boolean('is_banned').defaultTo(false);
    table.text('ban_reason');
  });
  
  await knex.schema.raw('CREATE INDEX idx_users_coin_balance ON users (coin_balance DESC)');
  await knex.schema.raw('CREATE INDEX idx_users_ai_level ON users (ai_level DESC)');
  await knex.schema.raw('CREATE INDEX idx_users_referred_by ON users (referred_by)');
  await knex.schema.raw('CREATE INDEX idx_users_last_active ON users (last_active_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
