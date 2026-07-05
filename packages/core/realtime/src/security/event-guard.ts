import type { SrtspEvent, SrtspPublishInput } from "../types";

const FORBIDDEN_KEYS = ["service_role", "bypass_rls", "admin_override"] as const;

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /service_role/i,
] as const;

/** Garde client Enterprise — ne remplace pas RLS. */
export class EventGuard {
  constructor(private readonly requireActor = false) {}

  assertCanPublish(input: SrtspPublishInput, actor?: SrtspEvent["actor"]): void {
    if (!this.requireActor) return;
    const effective = input.actor ?? actor;
    if (!effective?.userId) {
      throw new Error("SRTSP: publication refusée — acteur authentifié requis");
    }
  }

  sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    return this.stripSensitive(this.stripForbidden(payload));
  }

  private stripForbidden(payload: Record<string, unknown>): Record<string, unknown> {
    const clone = { ...payload };
    for (const key of FORBIDDEN_KEYS) {
      if (key in clone) delete clone[key];
    }
    return clone;
  }

  private stripSensitive(payload: Record<string, unknown>, depth = 0): Record<string, unknown> {
    if (depth > 4) return payload;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (SENSITIVE_PATTERNS.some((p) => p.test(key))) continue;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        out[key] = this.stripSensitive(value as Record<string, unknown>, depth + 1);
      } else {
        out[key] = value;
      }
    }
    return out;
  }
}
