import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";

/** Audiences — extensible sans refactor UI. */
export type RewardAudience = "all" | "listener" | "artist";

export type RewardCategory =
  | "progression"
  | "activity"
  | "community"
  | "creation"
  | "loyalty"
  | "special"
  | "seasonal"
  | "event";

export type RewardRarity = "common" | "rare" | "legendary" | "special";

export type RewardStatus = "locked" | "in_progress" | "unlocked";

export interface RewardContext {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
  unlockedRewardIds: Set<string>;
}

export interface RewardDefinition {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: RewardCategory;
  rarity: RewardRarity;
  audience: RewardAudience;
  order: number;
  prerequisiteRewardIds?: string[];
  evaluate: (ctx: Omit<RewardContext, "unlockedRewardIds">) => boolean;
  resolveUnlockedAt?: (ctx: Omit<RewardContext, "unlockedRewardIds">) => string | null;
  unlockMessage?: string;
  progressHint?: string;
}

export interface RewardViewModel {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: RewardCategory;
  categoryLabel: string;
  rarity: RewardRarity;
  rarityLabel: string;
  status: RewardStatus;
  unlockedAt: string | null;
  unlockMessage: string;
  progressHint: string | null;
  ariaLabel: string;
}

export interface RewardEngineViewModel {
  percent: number;
  unlockedCount: number;
  upcomingCount: number;
  inProgressCount: number;
  totalCount: number;
  motivationMessage: string;
  headlineMessage: string;
  unlocked: RewardViewModel[];
  inProgress: RewardViewModel[];
  upcoming: RewardViewModel[];
  all: RewardViewModel[];
}
