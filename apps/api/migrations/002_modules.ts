import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Catalogue des modules IA
  await knex.schema.createTable('ai_modules', (table) => {
    table.increments('id').primary();
    table.string('code', 50).unique().notNullable();
    table.string('name', 100).notNullable();
    table.text('description');
    table.string('category', 50).notNullable(); // compute, specialty, dataset, algorithm, security
    table.text('icon_url');
    
    table.bigInteger('base_cost').notNullable();
    table.decimal('cost_multiplier', 3, 2).defaultTo(1.50);
    table.integer('max_level').defaultTo(10);
    
    table.integer('coins_per_hour_bonus').defaultTo(0);
    table.integer('energy_max_bonus').defaultTo(0);
    table.integer('energy_regen_bonus').defaultTo(0);
    table.decimal('tap_multiplier_bonus', 3, 2).defaultTo(1.0);
    
    table.integer('min_ai_level').defaultTo(0);
    table.string('required_module_code', 50);
    
    table.string('rarity', 20).defaultTo('common'); // common, rare, epic, legendary
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  // Modules possédés par les users
  await knex.schema.createTable('user_modules', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.integer('module_id').notNullable().references('id').inTable('ai_modules');
    table.integer('level').defaultTo(1);
    table.timestamp('acquired_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'module_id']);
  });
  
  await knex.schema.raw('CREATE INDEX idx_user_modules_user_id ON user_modules (user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_modules');
  await knex.schema.dropTableIfExists('ai_modules');
}
