import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";
import { PROFILE_JOURNEY_STEPS } from "./registry";
import type {
  JourneyProgressViewModel,
  JourneyStepContext,
  JourneyStepDefinition,
  JourneyStepStatus,
  JourneyStepViewModel,
} from "./types";

function filterStepsForAudience(
  steps: JourneyStepDefinition[],
  isArtist: boolean,
): JourneyStepDefinition[] {
  return steps.filter((step) => {
    if (step.audience === "all") return true;
    if (step.audience === "artist") return isArtist;
    return !isArtist;
  });
}

function prerequisitesMet(
  step: JourneyStepDefinition,
  completedIds: Set<string>,
): boolean {
  if (!step.prerequisiteIds?.length) return true;
  return step.prerequisiteIds.every((id) => completedIds.has(id));
}

function resolveStepStatuses(
  steps: JourneyStepDefinition[],
  ctx: JourneyStepContext,
): JourneyStepViewModel[] {
  const completedIds = new Set<string>();
  let currentAssigned = false;

  return steps.map((step) => {
    const isCompleted = step.evaluate(ctx);
    let status: JourneyStepStatus;

    if (isCompleted) {
      status = "completed";
      completedIds.add(step.id);
    } else if (!prerequisitesMet(step, completedIds)) {
      status = "locked";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    } else {
      status = "upcoming";
    }

    return {
      id: step.id,
      icon: step.icon,
      title: step.title,
      shortLabel: step.shortLabel,
      status,
      action: step.action,
      whyImportant: step.whyImportant,
      benefits: step.benefits,
    };
  });
}

function getMotivationMessage(percent: number, isArtist: boolean): string {
  if (percent >= 100) {
    return "Félicitations — votre parcours SONAFRIK est complet.";
  }
  if (percent >= 71) {
    return isArtist
      ? "Plus qu'une étape avant votre prochain cap artistique."
      : "Plus qu'une étape pour enrichir votre expérience musicale.";
  }
  if (percent >= 41) {
    return "Votre carrière prend forme.";
  }
  if (percent >= 21) {
    return "Vous progressez rapidement.";
  }
  return "Excellent début — votre aventure commence ici.";
}

function findNextStep(
  steps: JourneyStepViewModel[],
  current: JourneyStepViewModel | null,
): JourneyStepViewModel | null {
  if (!current) {
    return steps.find((s) => s.status === "upcoming" || s.status === "locked") ?? null;
  }
  const currentIndex = steps.findIndex((s) => s.id === current.id);
  for (let i = currentIndex + 1; i < steps.length; i += 1) {
    const step = steps[i];
    if (step && step.status !== "completed") return step;
  }
  return null;
}

export function buildProfileJourney(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): JourneyProgressViewModel {
  const ctx: JourneyStepContext = { profile, activity, isArtist };
  const applicable = filterStepsForAudience(
    [...PROFILE_JOURNEY_STEPS].sort((a, b) => a.order - b.order),
    isArtist,
  );
  const steps = resolveStepStatuses(applicable, ctx);
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalCount = steps.length;
  const remainingCount = totalCount - completedCount;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentStep = steps.find((s) => s.status === "current") ?? null;

  return {
    percent,
    completedCount,
    remainingCount,
    totalCount,
    currentStep,
    nextStep: findNextStep(steps, currentStep),
    motivationMessage: getMotivationMessage(percent, isArtist),
    steps,
  };
}
