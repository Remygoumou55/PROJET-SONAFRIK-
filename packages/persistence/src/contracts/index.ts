export type { MetadataPersistenceRepository } from "./metadata.repository";
export type {
  ISRCPersistenceRepository,
  ISRCSequencePersistenceRepository,
} from "./isrc.repository";
export type { UPCPersistenceRepository, UPCRegistryEntry } from "./upc.repository";
export type { FingerprintPersistenceRepository } from "./fingerprint.repository";
export type { AuditPersistenceRepository } from "./audit.repository";
export type { VersionPersistenceRepository } from "./version.repository";
export type { RegistryPersistenceRepository } from "./registry.repository";
export type { ReleasePersistenceRepository } from "./release.repository";

import type { MetadataPersistenceRepository } from "./metadata.repository";
import type { ISRCPersistenceRepository, ISRCSequencePersistenceRepository } from "./isrc.repository";
import type { UPCPersistenceRepository } from "./upc.repository";
import type { FingerprintPersistenceRepository } from "./fingerprint.repository";
import type { AuditPersistenceRepository } from "./audit.repository";
import type { VersionPersistenceRepository } from "./version.repository";
import type { RegistryPersistenceRepository } from "./registry.repository";
import type { ReleasePersistenceRepository } from "./release.repository";

/** Aggregate repository bundle — injected into services Phase 3.5+ */
export interface MetadataRepositoryBundle {
  readonly metadata: MetadataPersistenceRepository;
  readonly isrc: ISRCPersistenceRepository;
  readonly isrcSequence: ISRCSequencePersistenceRepository;
  readonly upc: UPCPersistenceRepository;
  readonly fingerprint: FingerprintPersistenceRepository;
  readonly audit: AuditPersistenceRepository;
  readonly version: VersionPersistenceRepository;
  readonly registry: RegistryPersistenceRepository;
  readonly release: ReleasePersistenceRepository;
}
