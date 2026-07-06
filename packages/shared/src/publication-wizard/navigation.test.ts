import { describe, expect, it } from "vitest";
import {
  canNavigateToStep,
  computeMaxValidatedStep,
  isStepClickable,
  parseWizardStepFromSearch,
  readWizardStepFromHistoryState,
  resolveInitialWizardStep,
  resolveStepStatus,
} from "./navigation";

describe("publicationWizardNavigation", () => {
  it("computeMaxValidatedStep", () => {
    expect(computeMaxValidatedStep({ hasRelease: false, filesCompleted: false, metadataCompleted: false })).toBe(1);
    expect(computeMaxValidatedStep({ hasRelease: true, filesCompleted: false, metadataCompleted: false })).toBe(2);
    expect(computeMaxValidatedStep({ hasRelease: true, filesCompleted: true, metadataCompleted: false })).toBe(3);
    expect(computeMaxValidatedStep({ hasRelease: true, filesCompleted: true, metadataCompleted: true })).toBe(4);
  });

  it("canNavigateToStep — étapes futures verrouillées", () => {
    expect(canNavigateToStep(2, 1)).toBe(false);
    expect(canNavigateToStep(2, 2)).toBe(true);
    expect(canNavigateToStep(4, 3)).toBe(false);
  });

  it("isStepClickable", () => {
    expect(isStepClickable(2, 3, 3)).toBe(true);
    expect(isStepClickable(3, 3, 3)).toBe(false);
    expect(isStepClickable(4, 2, 2)).toBe(false);
  });

  it("resolveStepStatus", () => {
    expect(resolveStepStatus(2, 3, 3)).toBe("done");
    expect(resolveStepStatus(3, 3, 3)).toBe("active");
    expect(resolveStepStatus(4, 2, 2)).toBe("pending");
  });

  it("readWizardStepFromHistoryState", () => {
    expect(readWizardStepFromHistoryState({ wizardStep: 2 })).toBe(2);
    expect(readWizardStepFromHistoryState({ wizardStep: 9 })).toBeNull();
    expect(readWizardStepFromHistoryState(null)).toBeNull();
  });

  it("parseWizardStepFromSearch", () => {
    expect(parseWizardStepFromSearch("?step=3")).toBe(3);
    expect(parseWizardStepFromSearch("step=4")).toBe(4);
    expect(parseWizardStepFromSearch("?step=9")).toBeNull();
  });

  it("resolveInitialWizardStep — clamp étapes non validées", () => {
    expect(resolveInitialWizardStep(4, null, 2)).toBe(2);
    expect(resolveInitialWizardStep(null, 3, 3)).toBe(3);
    expect(resolveInitialWizardStep(null, null, 1)).toBe(1);
  });
});
