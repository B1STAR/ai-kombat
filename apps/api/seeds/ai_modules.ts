import type { Knex } from 'knex';

/**
 * AI Modules Seed — 20 levels max, cohesive dependency chain
 *
 * Dependency chain (all required_module_code point to modules that exist):
 *   gpu_v1 → gpu_v2 (lvl 3) → gpu_v3 (lvl 7) → gpu_v4 (lvl 12) → cluster (lvl 17) → gpt_core (lvl 20)
 *   nlp_module (lvl 3) → voice_module (lvl 8) → reasoning_module (lvl 15)
 *   dataset_wikipedia (lvl 2) → dataset_arxiv (lvl 6) → dataset_github (lvl 12)
 *   code_module (lvl 5) → algorithm_transformer (lvl 14)
 *   algorithm_optimizer (lvl 4)
 *   vision_module (lvl 5)
 *
 * MAX ai_level referenced = 20 ✅
 */
export const seedAiModules = async (knex: Knex): Promise<void> => {
  const exists = await knex('ai_modules').first();
  if (exists) {
    console.log('  ⏩ ai_modules already seeded');
    return;
  }

  await knex('ai_modules').insert([
    // =====================
    // === COMPUTE ===
    // =====================
    {
      code: 'gpu_v1',
      name: 'GPU V1',
      description: 'Le calcul de base pour ton IA. Premier pas vers la puissance.',
      category: 'compute',
      base_cost: 100,
      cost_multiplier: 1.5,
      coins_per_hour_bonus: 50,
      rarity: 'common',
      display_order: 1,
      // no min_ai_level, no required_module_code — accessible dès le début
    },
    {
      code: 'gpu_v2',
      name: 'GPU V2',
      description: 'Plus rapide que V1, 5x la puissance de calcul.',
      category: 'compute',
      base_cost: 1000,
      cost_multiplier: 1.5,
      coins_per_hour_bonus: 250,
      min_ai_level: 3,
      required_module_code: 'gpu_v1', // ✅ gpu_v1 existe
      rarity: 'common',
      display_order: 2,
    },
    {
      code: 'gpu_v3',
      name: 'GPU V3',
      description: 'GPU haut de gamme, performances débloquées.',
      category: 'compute',
      base_cost: 10000,
      cost_multiplier: 1.6,
      coins_per_hour_bonus: 1000,
      min_ai_level: 7,
      required_module_code: 'gpu_v2', // ✅ gpu_v2 existe
      rarity: 'rare',
      display_order: 3,
    },
    {
      code: 'gpu_v4',
      name: 'GPU V4',
      description: 'Architecture quantique expérimentale, x10 sur les traitements.',
      category: 'compute',
      base_cost: 50000,
      cost_multiplier: 1.7,
      coins_per_hour_bonus: 4000,
      min_ai_level: 12,
      required_module_code: 'gpu_v3', // ✅ gpu_v3 existe
      rarity: 'epic',
      display_order: 4,
    },
    {
      code: 'cluster',
      name: 'Cluster de calcul',
      description: 'Plusieurs GPUs V4 en parallèle. Puissance brute maximale.',
      category: 'compute',
      base_cost: 200000,
      cost_multiplier: 1.8,
      coins_per_hour_bonus: 15000,
      min_ai_level: 17,
      required_module_code: 'gpu_v4', // ✅ gpu_v4 existe
      rarity: 'epic',
      display_order: 5,
    },

    // =====================
    // === SPECIALTIES ===
    // =====================
    {
      code: 'nlp_module',
      name: 'Module NLP',
      description: 'Ton IA apprend à comprendre et générer du texte.',
      category: 'specialty',
      base_cost: 2000,
      cost_multiplier: 1.6,
      coins_per_hour_bonus: 300,
      min_ai_level: 3,
      // no required_module_code — premier module spécialité
      rarity: 'common',
      display_order: 10,
    },
    {
      code: 'vision_module',
      name: 'Module Vision',
      description: 'Ton IA apprend à voir et reconnaître les images.',
      category: 'specialty',
      base_cost: 5000,
      cost_multiplier: 1.7,
      coins_per_hour_bonus: 600,
      min_ai_level: 5,
      // indépendant, pas de prérequis de module
      rarity: 'rare',
      display_order: 11,
    },
    {
      code: 'code_module',
      name: 'Module Code',
      description: 'Ton IA apprend à écrire et débugger du code.',
      category: 'specialty',
      base_cost: 8000,
      cost_multiplier: 1.7,
      coins_per_hour_bonus: 900,
      min_ai_level: 5,
      required_module_code: 'nlp_module', // ✅ nlp_module existe — le code nécessite le langage
      rarity: 'rare',
      display_order: 12,
    },
    {
      code: 'voice_module',
      name: 'Module Voice',
      description: 'Ton IA apprend à comprendre et synthétiser la voix.',
      category: 'specialty',
      base_cost: 12000,
      cost_multiplier: 1.8,
      coins_per_hour_bonus: 1200,
      min_ai_level: 8,
      required_module_code: 'nlp_module', // ✅ nlp_module existe — la voix nécessite le texte
      rarity: 'epic',
      display_order: 13,
    },
    {
      code: 'reasoning_module',
      name: 'Module Raisonnement',
      description: 'Ton IA apprend à raisonner logiquement et enchaîner des inférences.',
      category: 'specialty',
      base_cost: 80000,
      cost_multiplier: 1.9,
      coins_per_hour_bonus: 8000,
      min_ai_level: 15,
      required_module_code: 'voice_module', // ✅ voice_module existe — le raisonnement nécessite voice+nlp
      rarity: 'legendary',
      display_order: 14,
    },

    // =====================
    // === DATASETS ===
    // =====================
    {
      code: 'dataset_wikipedia',
      name: 'Dataset Wikipedia',
      description: '15M articles, augmente la culture générale de ton IA.',
      category: 'dataset',
      base_cost: 500,
      cost_multiplier: 1.5,
      coins_per_hour_bonus: 100,
      min_ai_level: 2,
      // pas de prérequis — premier dataset
      rarity: 'common',
      display_order: 20,
    },
    {
      code: 'dataset_arxiv',
      name: 'Dataset ArXiv',
      description: '2M papers scientifiques, ton IA devient brillante.',
      category: 'dataset',
      base_cost: 5000,
      cost_multiplier: 1.6,
      coins_per_hour_bonus: 700,
      min_ai_level: 6,
      required_module_code: 'dataset_wikipedia', // ✅ dataset_wikipedia existe
      rarity: 'rare',
      display_order: 21,
    },
    {
      code: 'dataset_github',
      name: 'Dataset GitHub',
      description: 'Des millions de repos, ton IA devient une machine à coder.',
      category: 'dataset',
      base_cost: 30000,
      cost_multiplier: 1.7,
      coins_per_hour_bonus: 3000,
      min_ai_level: 12,
      required_module_code: 'dataset_arxiv', // ✅ dataset_arxiv existe
      rarity: 'epic',
      display_order: 22,
    },
    {
      code: 'dataset_multimodal',
      name: 'Dataset Multimodal',
      description: 'Images, audio, texte et vidéos. Ton IA perçoit tout.',
      category: 'dataset',
      base_cost: 150000,
      cost_multiplier: 1.8,
      coins_per_hour_bonus: 12000,
      min_ai_level: 18,
      required_module_code: 'dataset_github', // ✅ dataset_github existe
      rarity: 'legendary',
      display_order: 23,
    },

    // =====================
    // === ALGORITHMS ===
    // =====================
    {
      code: 'algorithm_optimizer',
      name: 'Algorithme Optimiseur',
      description: 'Réduit le coût en énergie, régénération plus rapide.',
      category: 'algorithm',
      base_cost: 3000,
      cost_multiplier: 1.6,
      energy_regen_bonus: 1,
      min_ai_level: 4,
      // pas de prérequis — accessible tôt
      rarity: 'rare',
      display_order: 30,
    },
    {
      code: 'algorithm_transformer',
      name: 'Algorithme Transformer',
      description: 'Architecture Transformer de pointe, +30% sur tous les gains.',
      category: 'algorithm',
      base_cost: 40000,
      cost_multiplier: 1.7,
      tap_multiplier_bonus: 1.3,
      min_ai_level: 14,
      required_module_code: 'code_module', // ✅ code_module existe — le transformer nécessite du code
      rarity: 'epic',
      display_order: 31,
    },
    {
      code: 'algorithm_rlhf',
      name: 'Algorithme RLHF',
      description: 'Reinforcement Learning from Human Feedback. L\'IA apprend de ses erreurs.',
      category: 'algorithm',
      base_cost: 120000,
      cost_multiplier: 1.8,
      tap_multiplier_bonus: 1.5,
      min_ai_level: 18,
      required_module_code: 'algorithm_transformer', // ✅ algorithm_transformer existe
      rarity: 'legendary',
      display_order: 32,
    },

    // =====================
    // === THE GRAIL (niveau 20) ===
    // =====================
    {
      code: 'gpt_core',
      name: 'GPT Core',
      description: 'Le saint graal. Ton IA devient une AGI. Niveau maximum atteint.',
      category: 'compute',
      base_cost: 1000000,
      cost_multiplier: 2.0,
      coins_per_hour_bonus: 100000,
      max_level: 1,
      min_ai_level: 20,                   // ✅ niveau max = 20
      required_module_code: 'reasoning_module', // ✅ reasoning_module existe (lvl 15)
      rarity: 'legendary',
      display_order: 99,
    },
  ]);

  console.log('  ✅ ai_modules seeded (17 modules, max level 20, no broken dependencies)');
};
