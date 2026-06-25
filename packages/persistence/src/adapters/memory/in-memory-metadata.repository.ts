import type { MetadataDomainRecord, MetadataID, MetadataStatus } from "@sonafrik/types";
import type { MetadataContext } from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { MetadataPersistenceRepository } from "../../contracts/metadata.repository";
import { NotFoundError } from "../../errors/persistence-errors";

/** In-memory metadata store — full CRUD for tests */
export class InMemoryMetadataRepository implements MetadataPersistenceRepository {
  private readonly store = new Map<string, MetadataDomainRecord>();

  async findById(
    metadataId: MetadataID,
    _context: MetadataContext,
  ): Promise<MetadataDomainRecord | null> {
    return this.store.get(metadataId as string) ?? null;
  }

  async save(
    record: MetadataDomainRecord,
    _context: PersistenceContext,
  ): Promise<MetadataDomainRecord> {
    const stored = Object.freeze({ ...record });
    this.store.set(record.id as string, stored);
    return stored;
  }

  async archive(metadataId: MetadataID, _context: PersistenceContext): Promise<void> {
    const entry = this.store.get(metadataId as string);
    if (!entry) throw new NotFoundError();
    this.store.set(
      metadataId as string,
      Object.freeze({ ...entry, status: "archived" as MetadataStatus }),
    );
  }

  async search(
    _filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly MetadataDomainRecord[]> {
    const all = [...this.store.values()];
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async findTrackMetadata(): Promise<null> {
    return null;
  }
  async findAlbumMetadata(): Promise<null> {
    return null;
  }
  async findArtistMetadata(): Promise<null> {
    return null;
  }
  async findReleaseMetadata(): Promise<null> {
    return null;
  }
  async findRoyaltyMetadata(): Promise<null> {
    return null;
  }
  async findDistributionMetadata(): Promise<null> {
    return null;
  }
  async findFingerprintMetadata(): Promise<null> {
    return null;
  }
  async findVersionMetadata(): Promise<null> {
    return null;
  }
  async findAuditMetadata(): Promise<null> {
    return null;
  }
  async findStorageMetadata(): Promise<null> {
    return null;
  }
  async findDeliveryMetadata(): Promise<null> {
    return null;
  }
}
