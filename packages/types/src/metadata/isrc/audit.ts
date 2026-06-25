import type { ISRCValue } from "../ids";
import type { ISRCAuditAction } from "./enums";

/** In-memory / future persistent audit record */
export interface ISRCAuditEntry {
  readonly id: string;
  readonly action: ISRCAuditAction;
  readonly isrc: ISRCValue | null;
  readonly actorId: string;
  readonly correlationId: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
}
