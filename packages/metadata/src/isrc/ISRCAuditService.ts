import type {
  ISRCAuditAction,
  ISRCAuditEntry,
  ISRCValue,
} from "@sonafrik/types";

export interface ISRCAuditService {
  record(
    action: ISRCAuditAction,
    isrc: ISRCValue | null,
    actorId: string,
    correlationId: string,
    payload?: Readonly<Record<string, unknown>>,
  ): Promise<ISRCAuditEntry>;
  findByIsrc(isrc: ISRCValue): readonly ISRCAuditEntry[];
  findAll(): readonly ISRCAuditEntry[];
}

let auditCounter = 0;

export class ISRCAuditServiceImpl implements ISRCAuditService {
  private readonly entries: ISRCAuditEntry[] = [];

  async record(
    action: ISRCAuditAction,
    isrc: ISRCValue | null,
    actorId: string,
    correlationId: string,
    payload: Readonly<Record<string, unknown>> = {},
  ): Promise<ISRCAuditEntry> {
    auditCounter += 1;
    const entry: ISRCAuditEntry = {
      id: `isrc-audit-${auditCounter}`,
      action,
      isrc,
      actorId,
      correlationId,
      payload,
      occurredAt: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  findByIsrc(isrc: ISRCValue): readonly ISRCAuditEntry[] {
    return this.entries.filter((e) => e.isrc === isrc);
  }

  findAll(): readonly ISRCAuditEntry[] {
    return [...this.entries];
  }
}

/** Reset counter for test isolation */
export function resetAuditCounter(): void {
  auditCounter = 0;
}
