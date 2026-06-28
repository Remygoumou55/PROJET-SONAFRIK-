import type { Profile } from "@sonafrik/types";
import {
  computeProfileCompletion,
  type ProfileActivitySummary,
} from "../profilePresentation";
import { buildProfileJourney } from "../profileJourney";
import { buildRewardEngine } from "../profileRewards";
import { mergeGoalDefinitions } from "./adapters";
import { getGoalCadenceLabel, getGoalCategoryLabel } from "./categories";
import { PROFILE_GOAL_DEFINITIONS } from "./registry";
import type {
  GoalDefinition,
  GoalStatus,
  GoalViewModel,
  SmartGoalsContext,
  SmartGoalsEngineViewModel,
} from "./types";

function filterGoalsForAudience(
  goals: GoalDefinition[],
  isArtist: boolean,
): GoalDefinition[] {
  return goals.filter((goal) => {
    if (goal.audience === "all") return true;
    if (goal.audience === "artist") return isArtist;
    if (goal.audience === "listener") return !isArtist;
    return false;
  });
}

function prerequisitesMet(
  goal: GoalDefinition,
  completedIds: Set<string>,
): boolean {
  if (!goal.prerequisiteGoalIds?.length) return true;
  return goal.prerequisiteGoalIds.every((id) => completedIds.has(id));
}

function buildContext(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): SmartGoalsContext {
  const journey = buildProfileJourney(profile, activity, isArtist);
  const rewards = buildRewardEngine(profile, activity, isArtist);

  return {
    profile,
    activity,
    isArtist,
    profileCompletionPercent: computeProfileCompletion(profile),
    journeyPercent: journey.percent,
    journeyCurrentStepId: journey.currentStep?.id ?? null,
    rewardsUnlockedCount: rewards.unlockedCount,
    publishedTracks: activity.publishedTracks ?? 0,
    publishedAlbums: activity.publishedAlbums ?? 0,
  };
}

function selectPrimaryGoalId(
  applicable: GoalDefinition[],
  ctx: SmartGoalsContext,
  completedIds: Set<string>,
): string | null {
  const candidates = applicable.filter(
    (goal) => !goal.isCompleted(ctx) && prerequisitesMet(goal, completedIds),
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return a.order - b.order;
  });

  return candidates[0]?.id ?? null;
}

function resolveStatus(
  goal: GoalDefinition,
  ctx: SmartGoalsContext,
  completedIds: Set<string>,
  primaryGoalId: string | null,
): GoalStatus {
  if (goal.isCompleted(ctx)) return "completed";
  if (!prerequisitesMet(goal, completedIds)) return "locked";

  const progress = Math.min(Math.max(goal.resolveProgress(ctx), 0), 100);

  if (goal.id === primaryGoalId) return "in_progress";
  if (progress > 0 && progress < 100) return "in_progress";
  return "upcoming";
}

function buildGoalViewModel(
  goal: GoalDefinition,
  ctx: SmartGoalsContext,
  status: GoalStatus,
): GoalViewModel {
  const progress =
    status === "completed"
      ? 100
      : Math.min(Math.max(goal.resolveProgress(ctx), 0), 100);

  const statusLabel =
    status === "completed"
      ? "Objectif atteint"
      : status === "in_progress"
        ? "En cours"
        : status === "upcoming"
          ? "À venir"
          : "Verrouillé";

  return {
    id: goal.id,
    icon: goal.icon,
    title: goal.title,
    shortTitle: goal.shortTitle,
    description: goal.description,
    cadence: goal.cadence,
    cadenceLabel: getGoalCadenceLabel(goal.cadence),
    categoryLabel: getGoalCategoryLabel(goal.category),
    status,
    progress,
    deadline: goal.resolveDeadline?.(ctx) ?? null,
    benefits: goal.benefits ?? [],
    nextStepHint: goal.nextStepHint?.(ctx) ?? null,
    action: goal.action,
    completionMessage: goal.completionMessage ?? null,
    ariaLabel: `${goal.title} — ${statusLabel}, ${progress} %`,
  };
}

function getMotivationMessage(
  completedCount: number,
  totalCount: number,
  isArtist: boolean,
): string {
  const percent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (percent >= 100) {
    return "Tous vos objectifs actifs sont atteints — de nouveaux horizons s'ouvrent.";
  }
  if (percent >= 60) {
    return "Votre progression est régulière — continuez à construire votre carrière.";
  }
  if (completedCount >= 1) {
    return "Chaque action compte — votre prochaine étape vous rapproche de vos objectifs.";
  }
  return isArtist
    ? "Votre carrière musicale commence ici — un objectif à la fois."
    : "Votre aventure musicale commence ici — explorez, écoutez, progressez.";
}

function getHeadlineMessage(
  primary: GoalViewModel | null,
  activeCount: number,
): string {
  if (!primary) {
    return "Vos objectifs évoluent avec votre parcours SONAFRIK.";
  }
  if (primary.status === "completed") {
    return "Objectif principal atteint — cap sur le suivant.";
  }
  return `${activeCount} objectif${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""} — focus sur « ${primary.shortTitle} ».`;
}

function getNextStepMessage(primary: GoalViewModel | null): string {
  if (!primary) {
    return "Les objectifs s'adaptent à votre niveau et à votre parcours.";
  }
  if (primary.nextStepHint) return primary.nextStepHint;
  if (primary.status === "completed" && primary.completionMessage) {
    return primary.completionMessage;
  }
  return "Votre prochaine étape vous rapproche de vos objectifs.";
}

export function buildSmartGoalsEngine(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): SmartGoalsEngineViewModel {
  const ctx = buildContext(profile, activity, isArtist);
  const merged = mergeGoalDefinitions(PROFILE_GOAL_DEFINITIONS, ctx);
  const applicable = filterGoalsForAudience(
    [...merged].sort((a, b) => a.order - b.order),
    isArtist,
  );

  const completedIds = new Set<string>();
  for (const goal of applicable) {
    if (goal.isCompleted(ctx)) completedIds.add(goal.id);
  }

  const primaryGoalId = selectPrimaryGoalId(applicable, ctx, completedIds);

  const allGoals = applicable.map((goal) =>
    buildGoalViewModel(
      goal,
      ctx,
      resolveStatus(goal, ctx, completedIds, primaryGoalId),
    ),
  );

  const primaryGoal =
    allGoals.find((g) => g.id === primaryGoalId) ??
    allGoals.find((g) => g.status === "in_progress") ??
    null;

  const secondaryGoals = allGoals
    .filter(
      (g) =>
        g.id !== primaryGoal?.id &&
        (g.status === "in_progress" || g.status === "upcoming"),
    )
    .slice(0, 3);

  const completedCount = allGoals.filter((g) => g.status === "completed").length;
  const activeCount = allGoals.filter(
    (g) => g.status === "in_progress" || g.status === "upcoming",
  ).length;
  const totalCount = allGoals.length;
  const overallProgressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    motivationMessage: getMotivationMessage(
      completedCount,
      totalCount,
      isArtist,
    ),
    headlineMessage: getHeadlineMessage(primaryGoal, activeCount),
    overallProgressPercent,
    activeCount,
    completedCount,
    totalCount,
    primaryGoal,
    secondaryGoals,
    nextStepMessage: getNextStepMessage(primaryGoal),
  };
}
