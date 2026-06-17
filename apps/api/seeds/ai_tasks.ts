import type { Knex } from 'knex';

export const seedAiTasks = async (knex: Knex): Promise<void> => {
  const exists = await knex('ai_tasks').first();
  if (exists) {
    console.log('  ⏩ ai_tasks already seeded');
    return;
  }
  
  // For Phase 1, we create 50 simple gamified tasks.
  // In Phase 2, we'll integrate with real datasets or use GPT to generate more.
  const tasks = [];
  
  // === IMAGE QCM tasks (20)
  for (let i = 1; i <= 20; i++) {
    tasks.push({
      type: 'image_qcm',
      question: 'Cette image est-elle un chat ou un chien ?',
      payload: JSON.stringify({
        image_url: `https://picsum.photos/seed/img${i}/400/300`,
        options: ['Chat', 'Chien'],
        correct_answer: i % 2 === 0 ? 'Chat' : 'Chien',
      }),
      difficulty: 'easy',
      reward_coins: 50,
      reward_xp: 10,
    });
  }
  
  // === SENTIMENT tasks (20)
  const sentiments = [
    { text: 'J\'adore ce produit, il est génial !', answer: 'positive' },
    { text: 'C\'est une arnaque totale, je suis déçu.', answer: 'negative' },
    { text: 'Le colis est arrivé aujourd\'hui.', answer: 'neutral' },
    { text: 'Service client exceptionnel, merci !', answer: 'positive' },
    { text: 'Je ne recommande pas du tout.', answer: 'negative' },
    { text: 'Le produit est conforme à la description.', answer: 'neutral' },
    { text: 'Meilleur achat de ma vie !', answer: 'positive' },
    { text: 'Très mauvaise qualité, ne fonctionne pas.', answer: 'negative' },
    { text: 'Le prix est correct pour ce que c\'est.', answer: 'neutral' },
    { text: 'Incroyable, je suis bluffé !', answer: 'positive' },
  ];
  
  for (let i = 0; i < 20; i++) {
    const s = sentiments[i % sentiments.length];
    tasks.push({
      type: 'sentiment',
      question: `Cette review est positive, négative ou neutre ?\n\n"${s.text}"`,
      payload: JSON.stringify({
        text: s.text,
        options: ['Positive', 'Négative', 'Neutre'],
        correct_answer: s.answer === 'positive' ? 'Positive' : s.answer === 'negative' ? 'Négative' : 'Neutre',
      }),
      difficulty: 'easy',
      reward_coins: 50,
      reward_xp: 10,
    });
  }
  
  // === VRAI/FAUX tasks (10) - some as gold standards
  const facts = [
    { text: 'Python est un langage de programmation créé dans les années 90.', answer: true },
    { text: 'Le bitcoin a été créé en 2009 par Satoshi Nakamoto.', answer: true },
    { text: 'Une IA peut penser exactement comme un humain aujourd\'hui.', answer: false },
    { text: 'L\'apprentissage supervisé nécessite des données étiquetées.', answer: true },
    { text: 'Le machine learning et l\'IA sont exactement la même chose.', answer: false },
    { text: 'Un réseau de neurones est inspiré du cerveau humain.', answer: true },
    { text: 'Les IAs génératives peuvent créer des images.', answer: true },
    { text: 'GPT signifie "Generative Pre-trained Transformer".', answer: true },
    { text: 'Le deep learning n\'a besoin d\'aucune donnée pour fonctionner.', answer: false },
    { text: 'Les IAs peuvent halluciner des informations incorrectes.', answer: true },
  ];
  
  for (let i = 0; i < 10; i++) {
    const f = facts[i];
    tasks.push({
      type: 'true_false',
      question: `Vrai ou Faux ?\n\n"${f.text}"`,
      payload: JSON.stringify({
        text: f.text,
        options: ['Vrai', 'Faux'],
        correct_answer: f.answer ? 'Vrai' : 'Faux',
      }),
      difficulty: 'medium',
      reward_coins: 75,
      reward_xp: 15,
      is_gold_standard: i < 5, // First 5 are gold standards for trust scoring
    });
  }
  
  await knex('ai_tasks').insert(tasks);
  console.log(`  ✅ ai_tasks seeded (${tasks.length} tasks, 5 gold standards)`);
};
