interface Proverb {
  text: string;
  origin: string;
}

const PROVERBS: Proverb[] = [
  {
    text: "La musique est le chemin le plus court entre deux cœurs.",
    origin: "Sagesse mandingue",
  },
  {
    text: "Celui qui chante efface la distance entre les peuples.",
    origin: "Tradition peule",
  },
  {
    text: "Le tam-tam parle, mais seul celui qui écoute vraiment entend.",
    origin: "Proverbe guinéen",
  },
  {
    text: "La kora ne vieillit pas : ses cordes portent la mémoire des ancêtres.",
    origin: "Griot mandingue",
  },
  {
    text: "Partager un rythme, c'est partager une âme.",
    origin: "Tradition soussou",
  },
  {
    text: "La voix qui chante la vérité ne connaît pas l'oubli.",
    origin: "Sagesse guinéenne",
  },
  {
    text: "Un peuple qui danse ensemble ne se divise pas facilement.",
    origin: "Proverbe d'Afrique de l'Ouest",
  },
  {
    text: "La musique est le vêtement que porte chaque culture pour se montrer au monde.",
    origin: "Tradition du Fouta Djallon",
  },
  {
    text: "L'enfant qui apprend à jouer du balafon apprend aussi à parler à ses aïeux.",
    origin: "Sagesse mandingue",
  },
  {
    text: "Là où la chanson s'élève, la paix pose ses bagages.",
    origin: "Proverbe de Kankan",
  },
];

/**
 * Retourne la citation du jour de façon déterministe (dayOfYear % total).
 * Même résultat côté serveur et client — pas de Math.random().
 */
export function getDailyProverb(): Proverb {
  const now = new Date();
  const startOfYear = new Date(now.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  );
  return PROVERBS[dayOfYear % PROVERBS.length]!;
}
