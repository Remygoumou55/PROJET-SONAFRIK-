import type { RewardCategory, RewardRarity } from "./types";

export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  progression: "Progression",
  activity: "Activité",
  community: "Communauté",
  creation: "Création",
  loyalty: "Fidélité",
  special: "Spécial SONAFRIK",
  seasonal: "Saisonnière",
  event: "Événementielle",
};

export const REWARD_RARITY_LABELS: Record<RewardRarity, string> = {
  common: "Commune",
  rare: "Rare",
  legendary: "Légendaire",
  special: "Événement spécial",
};

export function getRewardCategoryLabel(category: RewardCategory): string {
  return REWARD_CATEGORY_LABELS[category];
}

export function getRewardRarityLabel(rarity: RewardRarity): string {
  return REWARD_RARITY_LABELS[rarity];
}
