import type { GoalDefinition, SmartGoalsContext } from "./types";

/**
 * Contrat pour sources d'objectifs externes (IA, événements, sponsors…).
 * Brancher un adaptateur dans GOAL_SOURCE_ADAPTERS — aucun changement UI requis.
 */
export interface GoalSourceAdapter {
  id: string;
  priority: number;
  resolveGoals: (ctx: SmartGoalsContext) => GoalDefinition[];
}

/** Réservé Phase 8+ — objectifs générés par IA, collaboratifs, événementiels. */
export const GOAL_SOURCE_ADAPTERS: GoalSourceAdapter[] = [];

/**
 * Fusionne le registre statique avec les adaptateurs dynamiques futurs.
 */
export function mergeGoalDefinitions(
  registry: GoalDefinition[],
  ctx: SmartGoalsContext,
): GoalDefinition[] {
  const fromAdapters = GOAL_SOURCE_ADAPTERS.flatMap((adapter) =>
    adapter.resolveGoals(ctx),
  );
  return [...registry, ...fromAdapters];
}
