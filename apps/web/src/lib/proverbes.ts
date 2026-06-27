export interface Proverbe {
  text: string;
  source: string;
  region: string;
}

/** 14 proverbes — rotation déterministe SSR-safe (dayOfYear % length). */
export const PROVERBES_AFRICAINS: Proverbe[] = [
  {
    text: "La musique est le vêtement que porte chaque culture pour se montrer au monde.",
    source: "Tradition du Fouta Djallon",
    region: "Guinée",
  },
  {
    text: "Quand la musique résonne, les âmes se retrouvent.",
    source: "Proverbe mandingue",
    region: "Afrique de l'Ouest",
  },
  {
    text: "La voix est le premier instrument que Dieu a créé.",
    source: "Sagesse peule",
    region: "Guinée",
  },
  {
    text: "Celui qui chante fait partir les mauvais esprits.",
    source: "Proverbe soussou",
    region: "Guinée",
  },
  {
    text: "La kora parle quand les mots ne suffisent plus.",
    source: "Tradition des griots mandingues",
    region: "Afrique de l'Ouest",
  },
  {
    text: "Un peuple sans musique est un peuple sans mémoire.",
    source: "Sagesse africaine",
    region: "Afrique",
  },
  {
    text: "Le tam-tam appelle, le cœur répond.",
    source: "Proverbe guinéen",
    region: "Guinée",
  },
  {
    text: "La chanson est le chemin le plus court entre deux cœurs.",
    source: "Sagesse du Fouta",
    region: "Guinée",
  },
  {
    text: "On ne peut pas empêcher la musique de voyager.",
    source: "Proverbe malien",
    region: "Afrique de l'Ouest",
  },
  {
    text: "Le djembé qui résonne à Conakry est entendu jusqu'en diaspora.",
    source: "Sagesse contemporaine guinéenne",
    region: "Guinée",
  },
  {
    text: "La musique n'a pas de frontières, elle a des racines.",
    source: "Tradition africaine",
    region: "Afrique",
  },
  {
    text: "Chanter, c'est prier deux fois.",
    source: "Proverbe soufiste guinéen",
    region: "Guinée",
  },
  {
    text: "Le griot garde la mémoire que l'écrit oublie.",
    source: "Tradition orale mandingue",
    region: "Afrique de l'Ouest",
  },
  {
    text: "Une mélodie née à Labé peut toucher une âme à Paris.",
    source: "Sagesse de la diaspora guinéenne",
    region: "Diaspora",
  },
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Proverbe du jour — déterministe, sans Math.random(). */
export function getProverbeduJour(date = new Date()): Proverbe {
  const index = getDayOfYear(date) % PROVERBES_AFRICAINS.length;
  return PROVERBES_AFRICAINS[index]!;
}

/** Alias rétrocompatible avec Sprint 1. */
export function getDailyProverb(date = new Date()): { text: string; origin: string } {
  const proverbe = getProverbeduJour(date);
  return { text: proverbe.text, origin: proverbe.source };
}
