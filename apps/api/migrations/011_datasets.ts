import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Clients B2B (entreprises qui achètent nos datasets)
  await knex.schema.createTable('clients', (table) => {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).unique();
    table.string('api_key', 64).unique().notNullable();
    table.boolean('is_active').defaultTo(true);
    table.decimal('total_spent_usd', 12, 2).defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  // Jobs de datasets (chaque job = 1 commande d'un client)
  await knex.schema.createTable('dataset_jobs', (table) => {
    table.string('id', 50).primary();
    table.bigInteger('client_id').unsigned().notNullable().references('id').inTable('clients');
    table.string('name', 255).notNullable();
    table.string('type', 50).notNullable();
    table.jsonb('schema').notNullable();
    table.integer('total_items').notNullable();
    table.integer('completed_items').defaultTo(0);
    table.integer('votes_per_item').defaultTo(3);
    table.decimal('min_confidence', 3, 2).defaultTo(0.66);
    table.decimal('budget_usd', 10, 2);
    table.decimal('cost_usd', 10, 2);
    table.string('status', 20).defaultTo('pending');
    table.decimal('progress_percent', 5, 2).defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.timestamp('deadline_at', { useTz: true });
  });
  
  // Items individuels (1 image à classer, 1 texte à noter, etc.)
  await knex.schema.createTable('dataset_items', (table) => {
    table.bigIncrements('id').primary();
    table.string('job_id', 50).notNullable().references('id').inTable('dataset_jobs').onDelete('CASCADE');
    table.string('external_id', 255);
    table.jsonb('payload').notNullable();
    table.jsonb('correct_answer'); // null for normal, filled for gold standards
    table.boolean('is_gold_standard').defaultTo(false);
    table.string('status', 20).defaultTo('pending'); // pending, voting, validated, disputed
    table.jsonb('final_answer');
    table.decimal('confidence', 3, 2);
    table.integer('votes_count').defaultTo(0);
  });
  
  // Votes des joueurs
  await knex.schema.createTable('dataset_votes', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('item_id').notNullable().references('id').inTable('dataset_items').onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.jsonb('answer');
    table.boolean('is_correct');
    table.integer('time_spent_ms');
    table.timestamp('submitted_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.unique(['item_id', 'user_id']);
  });
  
  // Trust score par joueur (pour la qualité des votes B2B)
  await knex.schema.createTable('user_trust', (table) => {
    table.bigInteger('user_id').unsigned().primary().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.integer('trust_score').defaultTo(50);
    table.integer('gold_standard_passed').defaultTo(0);
    table.integer('gold_standard_failed').defaultTo(0);
    table.integer('total_tasks_completed').defaultTo(0);
    table.timestamp('last_strike_at', { useTz: true });
    table.boolean('is_shadow_banned').defaultTo(false);
    table.timestamp('last_updated', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  // Paiements des clients
  await knex.schema.createTable('client_payments', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('client_id').notNullable().references('id').inTable('clients');
    table.decimal('amount_usd', 10, 2);
    table.string('payment_method', 50);
    table.string('transaction_id', 255);
    table.string('status', 20);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  // Index
  await knex.schema.raw('CREATE INDEX idx_dataset_items_job_id ON dataset_items (job_id)');
  await knex.schema.raw('CREATE INDEX idx_dataset_items_status ON dataset_items (status)');
  await knex.schema.raw('CREATE INDEX idx_dataset_votes_user_id ON dataset_votes (user_id)');
  await knex.schema.raw('CREATE INDEX idx_dataset_jobs_status ON dataset_jobs (status)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_payments');
  await knex.schema.dropTableIfExists('user_trust');
  await knex.schema.dropTableIfExists('dataset_votes');
  await knex.schema.dropTableIfExists('dataset_items');
  await knex.schema.dropTableIfExists('dataset_jobs');
  await knex.schema.dropTableIfExists('clients');
}
