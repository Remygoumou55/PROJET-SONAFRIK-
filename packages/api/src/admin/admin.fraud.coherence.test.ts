import { describe, expect, it } from "vitest";
import { validateFraudSupervisionCoherence } from "./admin.fraud.coherence";
import type { AdminFraudSupervisionStats } from "./types";

function baseStats(overrides: Partial<AdminFraudSupervisionStats> = {}): AdminFraudSupervisionStats {
  return {
    totalFlagged: 387,
    totalIncidents: 387,
    flaggedThisMonth: 42,
    flaggedToday: 5,
    todayTotal: 1200,
    activeSessions: 12,
    fraudDetectedToday: 5,
    suspicionsToday: 5,
    confirmedFraudToday: 1,
    criticalIncidents: 80,
    criticalToday: 2,
    importantToday: 2,
    attentionToday: 1,
    watchAccounts: 3,
    validListensToday: 1100,
    rejectedListensToday: 100,
    listenSuccessRate: 92,
    normalSessionsToday: 1100,
    suspendedAccountsHint: 3,
    ...overrides,
  };
}

describe("validateFraudSupervisionCoherence", () => {
  it("accepte un snapshot SSOT cohérent", () => {
    expect(validateFraudSupervisionCoherence(baseStats())).toEqual([]);
  });

  it("détecte totalIncidents désaligné", () => {
    const issues = validateFraudSupervisionCoherence(baseStats({ totalIncidents: 300 }));
    expect(issues.some((i) => i.includes("totalIncidents"))).toBe(true);
  });

  it("détecte fraudDetectedToday désaligné", () => {
    const issues = validateFraudSupervisionCoherence(baseStats({ fraudDetectedToday: 9 }));
    expect(issues.some((i) => i.includes("fraudDetectedToday"))).toBe(true);
  });
});
