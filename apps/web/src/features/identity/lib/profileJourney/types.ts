import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";

/** Audiences cibles — extensible (label, manager, admin…) sans refactor UI. */
export type JourneyAudience = "all" | "listener" | "artist";

export type JourneyStepStatus = "completed" | "current" | "upcoming" | "locked";

export interface JourneyStepContext {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export interface JourneyStepAction {
  label: string;
  href: string;
}

export interface JourneyStepDefinition {
  id: string;
  icon: string;
  title: string;
  shortLabel: string;
  audience: JourneyAudience;
  order: number;
  prerequisiteIds?: string[];
  evaluate: (ctx: JourneyStepContext) => boolean;
  action?: JourneyStepAction;
  whyImportant?: string;
  benefits?: string[];
}

export interface JourneyStepViewModel {
  id: string;
  icon: string;
  title: string;
  shortLabel: string;
  status: JourneyStepStatus;
  action?: JourneyStepAction;
  whyImportant?: string;
  benefits?: string[];
}

export interface JourneyProgressViewModel {
  percent: number;
  completedCount: number;
  remainingCount: number;
  totalCount: number;
  currentStep: JourneyStepViewModel | null;
  nextStep: JourneyStepViewModel | null;
  motivationMessage: string;
  steps: JourneyStepViewModel[];
}
