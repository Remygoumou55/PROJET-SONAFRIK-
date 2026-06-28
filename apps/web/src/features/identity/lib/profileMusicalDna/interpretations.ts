import { GUINEAN_NATIONAL_LANGUAGE_CODES } from "./labels";
import type { DnaInterpretationViewModel, MusicalDnaContext, MusicalDnaViewModel } from "./types";

export interface DnaInterpretationDefinition {
  id: string;
  priority: number;
  matches: (
    ctx: MusicalDnaContext,
    model: Pick<MusicalDnaViewModel, "evolutionPercent" | "computedCategoryCount">,
  ) => boolean;
  headline: string;
  detail: string;
}

/**
 * Interprétations data-driven — la logique IA viendra enrichir ce registre.
 */
export const DNA_INTERPRETATIONS: DnaInterpretationDefinition[] = [
  {
    id: "guinea_core",
    priority: 90,
    matches: (ctx) =>
      ctx.profile.country_code?.toUpperCase() === "GN" ||
      GUINEAN_NATIONAL_LANGUAGE_CODES.has(ctx.profile.song_language?.toLowerCase() ?? ""),
    headline: "Vous écoutez principalement des artistes guinéens.",
    detail: "Votre ADN musical porte les racines de la scène locale — Conakry au cœur du continent.",
  },
  {
    id: "artist_catalog",
    priority: 85,
    matches: (ctx) => ctx.isArtist && ctx.publishedTracks > 0,
    headline: "Votre création nourrit votre ADN musical.",
    detail: "Vos publications enrichissent la cartographie de votre style sur SONAFRIK.",
  },
  {
    id: "evolving",
    priority: 80,
    matches: (_, model) => model.evolutionPercent >= 25 && model.evolutionPercent < 60,
    headline: "Votre ADN Musical est en pleine évolution.",
    detail: "Chaque écoute et chaque création affine votre signature — continuez à explorer SONAFRIK.",
  },
  {
    id: "diversifying",
    priority: 70,
    matches: (_, model) => model.evolutionPercent >= 60 && model.computedCategoryCount >= 3,
    headline: "Vos influences deviennent plus diversifiées.",
    detail: "Votre univers musical s'élargit naturellement — la Guinée reste votre ancrage.",
  },
  {
    id: "emerging",
    priority: 10,
    matches: () => true,
    headline: "Votre ADN Musical est en formation.",
    detail: "Votre identité musicale évolue avec votre activité — écoutez, créez, progressez.",
  },
];

export function resolveDnaInterpretation(
  ctx: MusicalDnaContext,
  model: Pick<MusicalDnaViewModel, "evolutionPercent" | "computedCategoryCount">,
): DnaInterpretationViewModel {
  const sorted = [...DNA_INTERPRETATIONS].sort((a, b) => b.priority - a.priority);
  const match = sorted.find((item) => item.matches(ctx, model)) ?? sorted[sorted.length - 1];

  if (!match) {
    return {
      id: "default",
      headline: "Votre univers musical évolue naturellement.",
      detail: "Votre identité musicale évolue avec votre parcours sur SONAFRIK.",
    };
  }

  return {
    id: match.id,
    headline: match.headline,
    detail: match.detail,
  };
}
