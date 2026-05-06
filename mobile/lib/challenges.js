const CHALLENGES = [
  { id: 'c1', text: 'Commence sans regarder ton téléphone pendant 10 min', xp: 15 },
  { id: 'c2', text: 'Termine cette étape debout', xp: 10 },
  { id: 'c3', text: 'Explique cette étape à voix haute avant de commencer', xp: 20 },
  { id: 'c4', text: 'Mets ton téléphone à l\'envers pendant ce cycle', xp: 10 },
  { id: 'c5', text: 'Fais 10 pompes avant de continuer', xp: 25 },
  { id: 'c6', text: 'Envoie un message à un ami pour lui dire ce que tu vas finir', xp: 15 },
  { id: 'c7', text: 'Travaille en silence total pendant ce cycle', xp: 10 },
  { id: 'c8', text: 'Résume ce que tu as fait en 3 bullet points', xp: 20 },
  { id: 'c9', text: 'Bois un grand verre d\'eau maintenant', xp: 5 },
  { id: 'c10', text: 'Fixe-toi un sous-objectif pour les 5 prochaines minutes', xp: 10 },
];

export function getRandomChallenge(excludeIds = []) {
  const available = CHALLENGES.filter((c) => !excludeIds.includes(c.id));
  if (available.length === 0) return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  return available[Math.floor(Math.random() * available.length)];
}
