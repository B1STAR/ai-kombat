import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_tasks', (table) => {
    table.bigIncrements('id').primary();
    table.string('type', 50).notNullable(); // image_qcm, sentiment, code_review, etc.
    table.text('question').notNullable();
    table.jsonb('payload').notNullable(); // { options: [...], correct_answer: ..., image_url: ... }
    table.string('difficulty', 20).defaultTo('easy'); // easy, medium, hard
    table.integer('reward_coins').defaultTo(50);
    table.integer('reward_xp').defaultTo(10);
    table.boolean('is_gold_standard').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  await knex.schema.createTable('user_task_submissions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('telegram_id').inTable('users').onDelete('CASCADE');
    table.bigInteger('task_id').notNullable().references('id').inTable('ai_tasks');
    table.jsonb('answer');
    table.boolean('is_correct');
    table.integer('time_spent_ms');
    table.timestamp('submitted_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  
  await knex.schema.raw('CREATE INDEX idx_user_submissions_user_id ON user_task_submissions (user_id)');
  await knex.schema.raw('CREATE INDEX idx_user_submissions_task_id ON user_task_submissions (task_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_task_submissions');
  await knex.schema.dropTableIfExists('ai_tasks');
}
