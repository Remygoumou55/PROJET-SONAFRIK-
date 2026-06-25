/** Stub repositories — contracts satisfied, no-op for Phase 3 prep */
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { AuditPersistenceRepository } from "../../contracts/audit.repository";
import type { FingerprintPersistenceRepository } from "../../contracts/fingerprint.repository";
import type { ReleasePersistenceRepository } from "../../contracts/release.repository";
import type { VersionPersistenceRepository } from "../../contracts/version.repository";
import type {
  AuditMetadata,
  AuditMetadataID,
  FingerprintID,
  FingerprintMetadata,
  ReleaseID,
  ReleaseMetadata,
  VersionID,
  VersionMetadata,
} from "@sonafrik/types";
import { NotFoundError } from "../../errors/persistence-errors";

export class InMemoryStubAuditRepository implements AuditPersistenceRepository {
  private readonly log: AuditMetadata[] = [];

  async append(record: AuditMetadata, _context: PersistenceContext): Promise<AuditMetadata> {
    this.log.push(record);
    return record;
  }

  async findById(
    auditId: AuditMetadataID,
    _context: PersistenceContext,
  ): Promise<AuditMetadata | null> {
    return this.log.find((e) => e.auditMetadataId === auditId) ?? null;
  }

  async search(
    _filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly AuditMetadata[]> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? this.log.length;
    return this.log.slice(offset, offset + limit);
  }
}

export class InMemoryStubFingerprintRepository implements FingerprintPersistenceRepository {
  async save(record: FingerprintMetadata, _context: PersistenceContext): Promise<FingerprintMetadata> {
    return record;
  }
  async findById(): Promise<null> {
    return null;
  }
  async findByTrackId(): Promise<null> {
    return null;
  }
  async findByHash(): Promise<readonly FingerprintMetadata[]> {
    return [];
  }
  async archive(_id: FingerprintID, _context: PersistenceContext): Promise<void> {
    /* no-op stub */
  }
}

export class InMemoryStubVersionRepository implements VersionPersistenceRepository {
  async save(snapshot: VersionMetadata, _context: PersistenceContext): Promise<VersionMetadata> {
    return snapshot;
  }
  async findById(): Promise<null> {
    return null;
  }
  async findByEntity(): Promise<readonly VersionMetadata[]> {
    return [];
  }
  async restore(versionId: VersionID, _context: PersistenceContext): Promise<VersionMetadata> {
    throw new NotFoundError(`Version ${versionId as string}`);
  }
}

export class InMemoryStubReleaseRepository implements ReleasePersistenceRepository {
  async save(release: ReleaseMetadata, _context: PersistenceContext): Promise<ReleaseMetadata> {
    return release;
  }
  async findById(): Promise<null> {
    return null;
  }
  async search(): Promise<readonly ReleaseMetadata[]> {
    return [];
  }
  async archive(_id: ReleaseID, _context: PersistenceContext): Promise<void> {
    /* no-op stub */
  }
}
