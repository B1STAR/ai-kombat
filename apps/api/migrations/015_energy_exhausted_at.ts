import type { Knex } from 'knex';

/**
 * Ajoute la colonne energy_exhausted_at sur la table users.
 * Utilisée par tap.ts pour tracker l'épuisement complet de l'énergie
 * et déclencher la recharge via le cron.
 */
export async function up(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn('users', 'energy_exhausted_at');
  if (!hasCol) {
    await knex.schema.alterTable('users', (table) => {
      table.timestamp('energy_exhausted_at', { useTz: true }).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn('users', 'energy_exhausted_at');
  if (hasCol) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('energy_exhausted_at');
    });
  }
}
