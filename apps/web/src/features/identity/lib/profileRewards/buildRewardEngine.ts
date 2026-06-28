import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";
import { getRewardCategoryLabel, getRewardRarityLabel } from "./categories";
import { PROFILE_REWARD_DEFINITIONS } from "./registry";
import type {
  RewardContext,
  RewardDefinition,
  RewardEngineViewModel,
  RewardStatus,
  RewardViewModel,
} from "./types";

function filterRewardsForAudience(
  rewards: RewardDefinition[],
  isArtist: boolean,
): RewardDefinition[] {
  return rewards.filter((reward) => {
    if (reward.audience === "all") return true;
    if (reward.audience === "artist") return isArtist;
    return !isArtist;
  });
}

function prerequisitesMet(
  reward: RewardDefinition,
  unlockedIds: Set<string>,
): boolean {
  if (!reward.prerequisiteRewardIds?.length) return true;
  return reward.prerequisiteRewardIds.every((id) => unlockedIds.has(id));
}

function resolveStatus(
  reward: RewardDefinition,
  isUnlocked: boolean,
  unlockedIds: Set<string>,
  inProgressId: string | null,
): RewardStatus {
  if (isUnlocked) return "unlocked";
  if (reward.id === inProgressId) return "in_progress";
  if (!prerequisitesMet(reward, unlockedIds)) return "locked";
  return "locked";
}

function getMotivationMessage(percent: number, unlockedCount: number): string {
  if (percent >= 100) {
    return "Collection complète — vous êtes un pilier de SONAFRIK.";
  }
  if (percent >= 60) {
    return "Chaque récompense rapproche votre carrière d'un nouveau niveau.";
  }
  if (unlockedCount >= 2) {
    return "Continuez — votre prochain objectif est proche.";
  }
  return "Félicitations pour vos premiers pas — de nouvelles récompenses vous attendent.";
}

function getHeadlineMessage(unlockedCount: number, upcomingCount: number): string {
  if (unlockedCount === 0) {
    return "Votre collection de récompenses commence aujourd'hui.";
  }
  if (upcomingCount === 0) {
    return "Vous avez débloqué toutes les récompenses disponibles.";
  }
  return `${unlockedCount} récompense${unlockedCount > 1 ? "s" : ""} obtenue${unlockedCount > 1 ? "s" : ""} — ${upcomingCount} encore à conquérir.`;
}

function findInProgressRewardId(
  rewards: RewardDefinition[],
  ctx: Omit<RewardContext, "unlockedRewardIds">,
  unlockedIds: Set<string>,
): string | null {
  for (const reward of rewards) {
    if (reward.evaluate(ctx)) continue;
    if (!prerequisitesMet(reward, unlockedIds)) continue;
    return reward.id;
  }
  return null;
}

function buildRewardViewModel(
  reward: RewardDefinition,
  ctx: Omit<RewardContext, "unlockedRewardIds">,
  status: RewardStatus,
): RewardViewModel {
  const isUnlocked = status === "unlocked";
  const unlockedAt = isUnlocked
    ? (reward.resolveUnlockedAt?.(ctx) ?? ctx.profile.updated_at)
    : null;

  const statusLabel =
    status === "unlocked"
      ? "Récompense débloquée"
      : status === "in_progress"
        ? "En progression"
        : "Récompense verrouillée";

  return {
    id: reward.id,
    icon: reward.icon,
    title: reward.title,
    description: reward.description,
    category: reward.category,
    categoryLabel: getRewardCategoryLabel(reward.category),
    rarity: reward.rarity,
    rarityLabel: getRewardRarityLabel(reward.rarity),
    status,
    unlockedAt,
    unlockMessage: reward.unlockMessage ?? "Bravo pour cette étape.",
    progressHint: reward.progressHint ?? null,
    ariaLabel: `${reward.title} — ${statusLabel}`,
  };
}

export function buildRewardEngine(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): RewardEngineViewModel {
  const baseCtx = { profile, activity, isArtist };
  const applicable = filterRewardsForAudience(
    [...PROFILE_REWARD_DEFINITIONS].sort((a, b) => a.order - b.order),
    isArtist,
  );

  const unlockedIds = new Set<string>();
  for (const reward of applicable) {
    if (reward.evaluate(baseCtx)) {
      unlockedIds.add(reward.id);
    }
  }

  const inProgressId = findInProgressRewardId(applicable, baseCtx, unlockedIds);

  const all: RewardViewModel[] = applicable.map((reward) => {
    const isUnlocked = unlockedIds.has(reward.id);
    const status = resolveStatus(reward, isUnlocked, unlockedIds, inProgressId);
    return buildRewardViewModel(reward, baseCtx, status);
  });

  const unlocked = all.filter((r) => r.status === "unlocked");
  const inProgress = all.filter((r) => r.status === "in_progress");
  const upcoming = all.filter((r) => r.status === "locked");
  const unlockedCount = unlocked.length;
  const totalCount = all.length;
  const upcomingCount = upcoming.length + inProgress.length;
  const inProgressCount = inProgress.length;
  const percent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    percent,
    unlockedCount,
    upcomingCount,
    inProgressCount,
    totalCount,
    motivationMessage: getMotivationMessage(percent, unlockedCount),
    headlineMessage: getHeadlineMessage(unlockedCount, upcomingCount),
    unlocked,
    inProgress,
    upcoming,
    all,
  };
}
