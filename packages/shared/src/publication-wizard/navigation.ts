/** Publication Wizard — Navigation Engine (Manual Interaction, wizard uniquement). */

export type WizardStep = 1 | 2 | 3 | 4;

export const WIZARD_STEP_LABELS = ["Créer", "Fichiers", "Informations", "Publication"] as const;

export type WizardStepStatus = "done" | "active" | "pending";

export type WizardProgressFlags = {
  hasRelease: boolean;
  filesCompleted: boolean;
  metadataCompleted: boolean;
};

export function computeMaxValidatedStep(flags: WizardProgressFlags): WizardStep {
  if (flags.metadataCompleted) return 4;
  if (flags.filesCompleted) return 3;
  if (flags.hasRelease) return 2;
  return 1;
}

export function canNavigateToStep(target: WizardStep, maxValidatedStep: WizardStep): boolean {
  return target >= 1 && target <= 4 && target <= maxValidatedStep;
}

export function resolveStepStatus(
  step: WizardStep,
  currentStep: WizardStep,
  maxValidatedStep: WizardStep,
): WizardStepStatus {
  if (step === currentStep) return "active";
  if (step < currentStep) return "done";
  if (step <= maxValidatedStep) return "done";
  return "pending";
}

export function isStepClickable(
  step: WizardStep,
  currentStep: WizardStep,
  maxValidatedStep: WizardStep,
): boolean {
  return step !== currentStep && canNavigateToStep(step, maxValidatedStep);
}

export function buildWizardStepUrl(step: WizardStep, pathname = ""): string {
  const base = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
  const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  url.searchParams.set("step", String(step));
  return `${url.pathname}${url.search}`;
}

export function pushWizardHistoryStep(step: WizardStep, pathname?: string): void {
  if (typeof window === "undefined") return;
  window.history.pushState({ wizardStep: step }, "", buildWizardStepUrl(step, pathname));
}

export function replaceWizardHistoryStep(step: WizardStep, pathname?: string): void {
  if (typeof window === "undefined") return;
  window.history.replaceState({ wizardStep: step }, "", buildWizardStepUrl(step, pathname));
}

export function readWizardStepFromHistoryState(state: unknown): WizardStep | null {
  if (!state || typeof state !== "object") return null;
  const value = (state as { wizardStep?: unknown }).wizardStep;
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
}

export function parseWizardStepFromSearch(search: string): WizardStep | null {
  const normalized = search.startsWith("?") ? search : search ? `?${search}` : "";
  const raw = new URLSearchParams(normalized).get("step");
  if (raw === "1" || raw === "2" || raw === "3" || raw === "4") {
    return Number(raw) as WizardStep;
  }
  return null;
}

/** Priorité : historique navigateur → query ?step= → étape 1, clampée au progrès validé. */
export function resolveInitialWizardStep(
  urlStep: WizardStep | null,
  historyStep: WizardStep | null,
  maxValidatedStep: WizardStep,
): WizardStep {
  const preferred = historyStep ?? urlStep ?? 1;
  if (canNavigateToStep(preferred, maxValidatedStep)) return preferred;
  return maxValidatedStep;
}
