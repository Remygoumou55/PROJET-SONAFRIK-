import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";

/** Audiences — extensible (label, manager, admin…) sans refactor UI. */
export type GoalAudience =
  | "all"
  | "listener"
  | "artist"
  | "label"
  | "manager"
  | "producer"
  | "organizer"
  | "admin";

/** Cadence / famille d'objectif — entièrement extensible via registre. */
export type GoalCadence =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "career"
  | "community"
  | "creation"
  | "discovery"
  | "personal"
  | "special"
  | "event";

export type GoalCategory = GoalCadence;

export type GoalStatus = "completed" | "in_progress" | "upcoming" | "locked";

export interface GoalAction {
  label: string;
  href: string;
}

/** Contexte enrichi — snapshots pour objectifs adaptatifs futurs (IA, événements…). */
export interface SmartGoalsContext {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
  profileCompletionPercent: number;
  journeyPercent: number;
  journeyCurrentStepId: string | null;
  rewardsUnlockedCount: number;
  publishedTracks: number;
  publishedAlbums: number;
}

export interface GoalDefinition {
  id: string;
  icon: string;
  title: string;
  shortTitle: string;
  description: string;
  cadence: GoalCadence;
  category: GoalCategory;
  audience: GoalAudience;
  order: number;
  /** Plus élevé = objectif principal prioritaire */
  priority: number;
  prerequisiteGoalIds?: string[];
  resolveProgress: (ctx: SmartGoalsContext) => number;
  isCompleted: (ctx: SmartGoalsContext) => boolean;
  resolveDeadline?: (ctx: SmartGoalsContext) => string | null;
  benefits?: string[];
  nextStepHint?: (ctx: SmartGoalsContext) => string;
  action?: GoalAction;
  completionMessage?: string;
}

export interface GoalViewModel {
  id: string;
  icon: string;
  title: string;
  shortTitle: string;
  description: string;
  cadence: GoalCadence;
  cadenceLabel: string;
  categoryLabel: string;
  status: GoalStatus;
  progress: number;
  deadline: string | null;
  benefits: string[];
  nextStepHint: string | null;
  action?: GoalAction;
  completionMessage: string | null;
  ariaLabel: string;
}

export interface SmartGoalsEngineViewModel {
  motivationMessage: string;
  headlineMessage: string;
  overallProgressPercent: number;
  activeCount: number;
  completedCount: number;
  totalCount: number;
  primaryGoal: GoalViewModel | null;
  secondaryGoals: GoalViewModel[];
  nextStepMessage: string;
}
