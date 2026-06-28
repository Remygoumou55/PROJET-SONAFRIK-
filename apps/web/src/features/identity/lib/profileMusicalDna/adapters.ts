import type { DnaCategoryDefinition, MusicalDnaContext } from "./types";

/**
 * Contrat pour sources ADN externes (historique d'écoute, IA, interactions…).
 * Brancher un adaptateur dans DNA_SOURCE_ADAPTERS — aucun changement UI requis.
 */
export interface DnaSourceAdapter {
  id: string;
  priority: number;
  resolveCategories: (ctx: MusicalDnaContext) => DnaCategoryDefinition[];
}

/** Réservé Phase 10+ — recommandations IA, matching artistes, playlists intelligentes. */
export const DNA_SOURCE_ADAPTERS: DnaSourceAdapter[] = [];

export function mergeDnaCategories(
  registry: DnaCategoryDefinition[],
  ctx: MusicalDnaContext,
): DnaCategoryDefinition[] {
  const fromAdapters = DNA_SOURCE_ADAPTERS.flatMap((adapter) =>
    adapter.resolveCategories(ctx),
  );
  return [...registry, ...fromAdapters];
}
