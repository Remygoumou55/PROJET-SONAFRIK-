import type { AdminFraudSupervisionStats } from "./types";

/**
 * Valide la cohérence interne des KPI fraude (SSOT).
 * Retourne la liste des écarts — utilisé en tests et monitoring dev.
 */
export function validateFraudSupervisionCoherence(stats: AdminFraudSupervisionStats): string[] {
  const issues: string[] = [];

  if (stats.totalIncidents !== stats.totalFlagged) {
    issues.push(`totalIncidents(${stats.totalIncidents}) !== totalFlagged(${stats.totalFlagged})`);
  }
  if (stats.flaggedToday !== stats.fraudDetectedToday) {
    issues.push(
      `flaggedToday(${stats.flaggedToday}) !== fraudDetectedToday(${stats.fraudDetectedToday})`,
    );
  }
  if (stats.suspicionsToday !== stats.flaggedToday) {
    issues.push(
      `suspicionsToday(${stats.suspicionsToday}) !== flaggedToday(${stats.flaggedToday})`,
    );
  }
  if (stats.validListensToday !== stats.normalSessionsToday) {
    issues.push("validListensToday !== normalSessionsToday (doublon attendu égal)");
  }
  if (stats.watchAccounts !== stats.suspendedAccountsHint) {
    issues.push("watchAccounts !== suspendedAccountsHint");
  }

  if (stats.todayTotal > 0) {
    const implied = stats.validListensToday + stats.rejectedListensToday;
    if (implied > stats.todayTotal + 1) {
      issues.push(`valid+rejected (${implied}) > todayTotal (${stats.todayTotal})`);
    }
  }

  if (stats.listenSuccessRate < 0 || stats.listenSuccessRate > 100) {
    issues.push(`listenSuccessRate hors bornes: ${stats.listenSuccessRate}`);
  }

  return issues;
}
