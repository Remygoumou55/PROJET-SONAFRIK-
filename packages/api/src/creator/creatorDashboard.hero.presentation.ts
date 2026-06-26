import type { Creator, CreatorDashboardHero } from "@sonafrik/types";
import type { BuildDashboardInput } from "./creatorDashboard.presentation.shared";
import { profileCompletionPercent } from "./creatorDashboard.presentation.shared";

const INSPIRATIONAL_QUOTES = [
  "Chaque écoute rapproche votre musique de ceux qui en ont besoin.",
  "La constance bat le talent quand le talent ne travaille pas.",
  "Votre prochain morceau peut changer votre trajectoire.",
  "Publiez, écoutez, progressez — SONAFRIK avance avec vous.",
  "Les fans d'aujourd'hui sont les ambassadeurs de demain.",
] as const;

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function quoteForToday(): string {
  const day = new Date().getDate();
  return INSPIRATIONAL_QUOTES[day % INSPIRATIONAL_QUOTES.length] ?? INSPIRATIONAL_QUOTES[0];
}

function tierLabel(tier: Creator["tier"]): string {
  const map = { emergent: "Émergent", croissance: "En croissance", etabli: "Établi" } as const;
  return map[tier] ?? "Artiste";
}

function levelFromStreams(streams: number): string {
  if (streams >= 1_000_000) return "Niveau Légende";
  if (streams >= 100_000) return "Niveau Star";
  if (streams >= 10_000) return "Niveau Confirmé";
  if (streams >= 1_000) return "Niveau Montée";
  if (streams > 0) return "Niveau Départ";
  return "Niveau Débutant";
}

export function buildHero(input: BuildDashboardInput): CreatorDashboardHero {
  const { artistProfile, creator } = input.context;
  const profilePercent = profileCompletionPercent(artistProfile);
  const { tracksPublished, albumsPublished } = input.catalogCounts;
  const streams = input.streamStats.total_streams;

  let headline = "Bienvenue sur SONAFRIK.";
  let subline = "Votre univers musical prend forme ici.";
  let currentGoal = "Compléter votre profil artiste.";
  let nextStep = "Ajoutez une bio et une photo pour inspirer confiance.";

  if (tracksPublished === 0) {
    headline = "Votre scène vous attend.";
    subline = "Publiez votre premier morceau pour être découvert.";
    currentGoal = "Publier votre premier morceau.";
    nextStep = "Un titre suffit pour lancer votre présence.";
  } else if (albumsPublished === 0 && tracksPublished > 0) {
    headline = "Votre musique commence à exister.";
    subline = "Encore une sortie pour structurer votre catalogue.";
    currentGoal = "Publier votre premier EP ou album.";
    nextStep = "Regroupez vos titres en projet cohérent.";
  } else if (streams > 0 && streams < 1000) {
    headline = "Votre musique est en mouvement.";
    subline = "Les premières écoutes arrivent — continuez.";
    currentGoal = "Atteindre 1 000 écoutes.";
    nextStep = "Partagez votre lien public cette semaine.";
  } else if (streams >= 1000) {
    headline = "Votre audience grandit.";
    subline = "Vos écoutes construisent votre carrière sur SONAFRIK.";
    currentGoal = "Consolider votre croissance.";
    nextStep = "Analysez vos statistiques et préparez la suite.";
  }

  if (profilePercent < 100 && tracksPublished > 0) {
    nextStep = `Profil à ${profilePercent} % — une photo peut faire la différence.`;
  }

  return {
    greeting: `${greetingForHour()} ${artistProfile.stage_name} 🎵`,
    headline,
    subline,
    quote: quoteForToday(),
    profilePercent,
    currentGoal,
    nextStep,
    tierLabel: tierLabel(creator.tier),
    levelLabel: levelFromStreams(streams),
  };
}
