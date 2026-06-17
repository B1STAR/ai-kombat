import type { Knex } from 'knex';

export const seedAchievements = async (knex: Knex): Promise<void> => {
  const exists = await knex('achievements').first();
  if (exists) {
    console.log('  ⏩ achievements already seeded');
    return;
  }
  
  await knex('achievements').insert([
    {
      code: 'first_tap',
      name: 'Premier tap',
      description: 'Tu as fait ton premier tap',
      reward_coins: 10,
      criteria: JSON.stringify({ type: 'taps', target: 1 }),
    },
    {
      code: 'tap_1k',
      name: '1 000 taps',
      description: 'Tu as fait 1 000 taps',
      reward_coins: 100,
      criteria: JSON.stringify({ type: 'taps', target: 1000 }),
    },
    {
      code: 'tap_10k',
      name: '10 000 taps',
      description: 'Tu as fait 10 000 taps',
      reward_coins: 500,
      reward_gems: 1,
      criteria: JSON.stringify({ type: 'taps', target: 10000 }),
    },
    {
      code: 'tap_100k',
      name: '100 000 taps',
      description: 'Tu as fait 100 000 taps. C\'est beaucoup trop.',
      reward_coins: 5000,
      reward_gems: 5,
      criteria: JSON.stringify({ type: 'taps', target: 100000 }),
    },
    {
      code: 'first_module',
      name: 'Premier module',
      description: 'Premier module acheté',
      reward_coins: 200,
      criteria: JSON.stringify({ type: 'modules_bought', target: 1 }),
    },
    {
      code: 'all_categories',
      name: 'Collectionneur',
      description: 'Achète au moins un module de chaque catégorie',
      reward_coins: 2000,
      criteria: JSON.stringify({ type: 'module_categories', target: 5 }),
    },
    {
      code: 'ai_level_10',
      name: 'IA niveau 10',
      description: 'Ton IA a atteint le niveau 10',
      reward_coins: 1000,
      criteria: JSON.stringify({ type: 'ai_level', target: 10 }),
    },
    {
      code: 'ai_level_25',
      name: 'IA niveau 25',
      description: 'Ton IA a atteint le niveau 25',
      reward_coins: 5000,
      reward_gems: 3,
      criteria: JSON.stringify({ type: 'ai_level', target: 25 }),
    },
    {
      code: 'ai_level_50',
      name: 'IA niveau 50 - Maître',
      description: 'Ton IA a atteint le niveau 50',
      reward_coins: 20000,
      reward_gems: 10,
      criteria: JSON.stringify({ type: 'ai_level', target: 50 }),
    },
    {
      code: 'first_referral',
      name: 'Premier ami invité',
      description: 'Tu as invité ton premier ami',
      reward_coins: 2000,
      criteria: JSON.stringify({ type: 'referrals', target: 1 }),
    },
    {
      code: 'streak_7',
      name: 'Streak 7 jours',
      description: 'Connecté 7 jours d\'affilée',
      reward_coins: 1000,
      criteria: JSON.stringify({ type: 'streak', target: 7 }),
    },
    {
      code: 'streak_30',
      name: 'Streak 30 jours',
      description: 'Un mois parfait. Dévoué.',
      reward_coins: 10000,
      reward_gems: 10,
      criteria: JSON.stringify({ type: 'streak', target: 30 }),
    },
  ]);
  
  console.log('  ✅ achievements seeded (12 achievements)');
};
