import type { Knex } from 'knex';

export const seedQuests = async (knex: Knex): Promise<void> => {
  const exists = await knex('quests').first();
  if (exists) {
    console.log('  ⏩ quests already seeded');
    return;
  }
  
  await knex('quests').insert([
    // === DAILY QUESTS ===
    {
      code: 'daily_login',
      name: 'Connexion quotidienne',
      description: 'Connecte-toi aujourd\'hui',
      type: 'daily',
      category: 'social',
      target_count: 1,
      target_action: 'login',
      reward_coins: 100,
    },
    {
      code: 'daily_tap_100',
      name: '100 taps',
      description: 'Fais 100 taps aujourd\'hui',
      type: 'daily',
      category: 'training',
      target_count: 100,
      target_action: 'tap',
      reward_coins: 50,
    },
    {
      code: 'daily_tap_500',
      name: '500 taps',
      description: 'Fais 500 taps aujourd\'hui',
      type: 'daily',
      category: 'training',
      target_count: 500,
      target_action: 'tap',
      reward_coins: 200,
    },
    {
      code: 'daily_tap_1000',
      name: '1000 taps',
      description: 'Fais 1000 taps aujourd\'hui (challenge!)',
      type: 'daily',
      category: 'training',
      target_count: 1000,
      target_action: 'tap',
      reward_coins: 500,
    },
    {
      code: 'daily_ai_task',
      name: 'Entraîne ton IA',
      description: 'Accomplis 3 tâches IA aujourd\'hui',
      type: 'daily',
      category: 'training',
      target_count: 3,
      target_action: 'complete_ai_task',
      reward_coins: 150,
      reward_xp: 30,
    },
    {
      code: 'daily_ad',
      name: 'Regarde une vidéo',
      description: 'Regarde une pub rewarded (optionnel)',
      type: 'daily',
      category: 'social',
      target_count: 1,
      target_action: 'watch_ad',
      reward_coins: 100,
    },
    
    // === ONE-TIME QUESTS ===
    {
      code: 'first_tap',
      name: 'Premier tap',
      description: 'Fais ton premier tap',
      type: 'one_time',
      category: 'training',
      target_count: 1,
      target_action: 'tap',
      reward_coins: 10,
    },
    {
      code: 'first_ai_task',
      name: 'Première tâche IA',
      description: 'Accomplis ta première tâche IA',
      type: 'one_time',
      category: 'training',
      target_count: 1,
      target_action: 'complete_ai_task',
      reward_coins: 100,
      reward_xp: 20,
    },
    {
      code: 'first_module',
      name: 'Premier module',
      description: 'Achète ton premier module',
      type: 'one_time',
      category: 'training',
      target_count: 1,
      target_action: 'buy_module',
      reward_coins: 200,
      reward_gems: 1,
    },
    {
      code: 'first_referral',
      name: 'Premier ami',
      description: 'Invite ton premier ami',
      type: 'one_time',
      category: 'social',
      target_count: 1,
      target_action: 'invite_friend',
      reward_coins: 2000,
      reward_gems: 5,
    },
    {
      code: 'streak_7',
      name: 'Semaine parfaite',
      description: 'Connecte-toi 7 jours d\'affilée',
      type: 'one_time',
      category: 'streak',
      target_count: 7,
      target_action: 'login',
      reward_coins: 1000,
      reward_gems: 3,
    },
  ]);
  
  console.log('  ✅ quests seeded (11 quests)');
};
