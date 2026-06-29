/**
 * Hiérarchie métier fraude — SSOT sémantique admin.
 *
 * Événement   → activité normale
 * Incident    → comportement inhabituel (écoute non retenue)
 * Suspicion   → signaux à vérifier (fraud_flags)
 * Fraude      → confirmée (patterns critiques validés)
 */

export const FRAUD_CRITICAL_FLAGS = [
  "multi_session_start",
  "bot_pattern",
  "duplicate_session",
] as const;

export const FRAUD_CONFIRMED_FLAGS = ["bot_pattern", "duplicate_session"] as const;

export const FRAUD_IMPORTANT_FLAGS = [
  "fast_forward_detected",
  "negative_position",
  "seek_abuse",
  "too_fast",
  "velocity",
] as const;

export const FRAUD_ATTENTION_FLAGS = ["orphaned_session", "repeated_start"] as const;

export type FraudBusinessTier = "event" | "incident" | "suspicion" | "fraud";

export function classifyIncidentTier(
  flags: string[],
  isValidListen: boolean,
): FraudBusinessTier {
  if (flags.some((f) => (FRAUD_CONFIRMED_FLAGS as readonly string[]).includes(f))) {
    return "fraud";
  }
  if (flags.length > 0) return "suspicion";
  if (!isValidListen) return "incident";
  return "event";
}

/** PostgREST overlap literal `{a,b,c}` */
export function pgArrayOverlapLiteral(flags: readonly string[]): string {
  return `{${flags.join(",")}}`;
}
