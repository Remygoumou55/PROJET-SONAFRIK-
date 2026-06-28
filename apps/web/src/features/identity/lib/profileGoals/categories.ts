import type { GoalCadence } from "./types";

const CADENCE_LABELS: Record<GoalCadence, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
  career: "Carrière",
  community: "Communauté",
  creation: "Création",
  discovery: "Découverte",
  personal: "Personnel",
  special: "Spécial SONAFRIK",
  event: "Événement",
};

export function getGoalCadenceLabel(cadence: GoalCadence): string {
  return CADENCE_LABELS[cadence];
}

export function getGoalCategoryLabel(category: GoalCadence): string {
  return CADENCE_LABELS[category];
}
