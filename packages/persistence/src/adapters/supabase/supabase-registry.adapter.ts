import type { ISRCValue, MetadataID } from "@sonafrik/types";
import type { PersistenceContext } from "@sonafrik/types";
import type { RegistryPersistenceRepository } from "../../contracts/registry.repository";
import { NotFoundError } from "../../errors/persistence-errors";
import { METADATA_TABLES, type SupabaseClientPort } from "./supabase-client.port";
import { fromTable, runQuery, runQueryNullable, runVoidQuery } from "./supabase-query.helpers";

interface RegistryRow {
  id: string;
  identifier_type: string;
  identifier_value: string;
  metadata_id: string;
}

export class SupabaseRegistryRepositoryAdapter implements RegistryPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async registerIsrc(
    isrc: ISRCValue,
    metadataId: MetadataID,
    _context: PersistenceContext,
  ): Promise<void> {
    await runQuery(() =>
      fromTable(this.client, METADATA_TABLES.REGISTRY_INDEX)
        .upsert({
          identifier_type: "isrc",
          identifier_value: isrc as string,
          metadata_id: metadataId as string,
        })
        .select()
        .single(),
    );
  }

  async lookupByIsrc(
    isrc: ISRCValue,
    _context: PersistenceContext,
  ): Promise<MetadataID | null> {
    const data = await runQueryNullable<RegistryRow>(() =>
      fromTable(this.client, METADATA_TABLES.REGISTRY_INDEX)
        .select("*")
        .eq("identifier_type", "isrc")
        .eq("identifier_value", isrc as string)
        .maybeSingle(),
    );
    return data ? (data.metadata_id as MetadataID) : null;
  }

  async registerUpc(
    upc: string,
    metadataId: MetadataID,
    _context: PersistenceContext,
  ): Promise<void> {
    await runQuery(() =>
      fromTable(this.client, METADATA_TABLES.REGISTRY_INDEX)
        .upsert({
          identifier_type: "upc",
          identifier_value: upc,
          metadata_id: metadataId as string,
        })
        .select()
        .single(),
    );
  }

  async lookupByUpc(upc: string, _context: PersistenceContext): Promise<MetadataID | null> {
    const data = await runQueryNullable<RegistryRow>(() =>
      fromTable(this.client, METADATA_TABLES.REGISTRY_INDEX)
        .select("*")
        .eq("identifier_type", "upc")
        .eq("identifier_value", upc)
        .maybeSingle(),
    );
    return data ? (data.metadata_id as MetadataID) : null;
  }

  async unregister(metadataId: MetadataID, _context: PersistenceContext): Promise<void> {
    const { data, error } = await fromTable(this.client, METADATA_TABLES.REGISTRY_INDEX)
      .select("id")
      .eq("metadata_id", metadataId as string);
    if (error) throw error;
    const rows = (data as { id: string }[] | null) ?? [];
    if (rows.length === 0) throw new NotFoundError();
    await runVoidQuery(() =>
      fromTable(this.client, METADATA_TABLES.REGISTRY_INDEX)
        .delete()
        .eq("metadata_id", metadataId as string),
    );
  }
}
