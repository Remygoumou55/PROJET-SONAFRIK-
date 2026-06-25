import type { ISRCRegistryEntry, ISRCValue } from "@sonafrik/types";
import { ISRC_AUDIT_ACTION, ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import type { ISRCAuditServiceImpl } from "./ISRCAuditService";
import { ISRCReservationError } from "./errors/ISRCError";
import type { ISRCRegistryImpl } from "./ISRCRegistry";
import { AsyncMutex } from "./utils/mutex";

export interface ISRCReservationService {
  reserve(isrc: ISRCValue, actorId: string, correlationId: string): Promise<ISRCRegistryEntry>;
  release(isrc: ISRCValue, actorId: string, correlationId: string): Promise<ISRCRegistryEntry>;
  commit(isrc: ISRCValue, actorId: string, correlationId: string): Promise<ISRCRegistryEntry>;
  isReserved(isrc: ISRCValue): Promise<boolean>;
}

export class ISRCReservationServiceImpl implements ISRCReservationService {
  private readonly mutex = new AsyncMutex();

  constructor(
    private readonly registry: ISRCRegistryImpl,
    private readonly audit: ISRCAuditServiceImpl,
  ) {}

  async reserve(
    isrc: ISRCValue,
    actorId: string,
    correlationId: string,
  ): Promise<ISRCRegistryEntry> {
    return this.mutex.run(async () => {
      let entry = await this.registry.lookup(isrc);

      if (!entry) {
        entry = await this.registry.register(isrc, { status: ISRC_REGISTRY_STATUS.AVAILABLE });
      }

      if (entry.status === ISRC_REGISTRY_STATUS.RESERVED) {
        throw new ISRCReservationError(`ISRC déjà réservé: ${isrc as string}`);
      }
      if (entry.status === ISRC_REGISTRY_STATUS.ACTIVE) {
        throw new ISRCReservationError(`ISRC déjà actif: ${isrc as string}`);
      }
      if (entry.status === ISRC_REGISTRY_STATUS.ARCHIVED) {
        throw new ISRCReservationError(`ISRC archivé: ${isrc as string}`);
      }
      if (entry.status === ISRC_REGISTRY_STATUS.DELETED) {
        throw new ISRCReservationError(`ISRC supprimé: ${isrc as string}`);
      }

      const updated = await this.registry.setReservation(
        isrc,
        actorId,
        ISRC_REGISTRY_STATUS.RESERVED,
      );

      await this.audit.record(ISRC_AUDIT_ACTION.RESERVED, isrc, actorId, correlationId, {
        reservedBy: actorId,
      });

      return updated;
    });
  }

  async release(
    isrc: ISRCValue,
    actorId: string,
    correlationId: string,
  ): Promise<ISRCRegistryEntry> {
    return this.mutex.run(async () => {
      const entry = await this.registry.lookup(isrc);
      if (!entry) {
        throw new ISRCReservationError("ISRC introuvable");
      }
      if (entry.status !== ISRC_REGISTRY_STATUS.RESERVED) {
        throw new ISRCReservationError("ISRC non réservé");
      }

      const updated = await this.registry.setReservation(
        isrc,
        null,
        ISRC_REGISTRY_STATUS.AVAILABLE,
      );

      await this.audit.record(ISRC_AUDIT_ACTION.RELEASED, isrc, actorId, correlationId);
      return updated;
    });
  }

  async commit(
    isrc: ISRCValue,
    actorId: string,
    correlationId: string,
  ): Promise<ISRCRegistryEntry> {
    return this.mutex.run(async () => {
      const entry = await this.registry.lookup(isrc);
      if (!entry) {
        throw new ISRCReservationError("ISRC introuvable");
      }
      if (
        entry.status !== ISRC_REGISTRY_STATUS.RESERVED &&
        entry.status !== ISRC_REGISTRY_STATUS.AVAILABLE
      ) {
        throw new ISRCReservationError(`Impossible de commit depuis status: ${entry.status}`);
      }

      const updated = await this.registry.setReservation(
        isrc,
        null,
        ISRC_REGISTRY_STATUS.ACTIVE,
      );

      await this.audit.record(ISRC_AUDIT_ACTION.COMMITTED, isrc, actorId, correlationId);
      return updated;
    });
  }

  async isReserved(isrc: ISRCValue): Promise<boolean> {
    const entry = await this.registry.lookup(isrc);
    return entry?.status === ISRC_REGISTRY_STATUS.RESERVED;
  }
}
