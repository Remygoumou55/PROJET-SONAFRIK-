import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type { UPCPersistenceRepository, UPCRegistryEntry } from "../../contracts/upc.repository";
import { mapVendorError, NotFoundError } from "../../errors/persistence-errors";
import {
  METADATA_RPC,
  METADATA_TABLES,
  type SupabaseClientPort,
} from "./supabase-client.port";
import { applyPagination, fromTable, runQuery, runQueryNullable } from "./supabase-query.helpers";

interface UPCRow {
  upc: string;
  status: string;
  album_id: string | null;
  reserved_by: string | null;
  reserved_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: UPCRow): UPCRegistryEntry {
  return {
    upc: row.upc,
    status: row.status as UPCRegistryEntry["status"],
    albumId: row.album_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function entryToRow(entry: UPCRegistryEntry): Record<string, unknown> {
  return {
    upc: entry.upc,
    status: entry.status,
    album_id: entry.albumId,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

export class SupabaseUPCRepositoryAdapter implements UPCPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async saveEntry(
    entry: UPCRegistryEntry,
    _context: PersistenceContext,
  ): Promise<UPCRegistryEntry> {
    const data = await runQuery<UPCRow>(() =>
      fromTable(this.client, METADATA_TABLES.UPC_REGISTRY)
        .upsert(entryToRow(entry))
        .select()
        .single(),
    );
    return rowToEntry(data);
  }

  async findByValue(upc: string, _context: PersistenceContext): Promise<UPCRegistryEntry | null> {
    const data = await runQueryNullable<UPCRow>(() =>
      fromTable(this.client, METADATA_TABLES.UPC_REGISTRY)
        .select("*")
        .eq("upc", upc)
        .maybeSingle(),
    );
    return data ? rowToEntry(data) : null;
  }

  async exists(upc: string, context: PersistenceContext): Promise<boolean> {
    return (await this.findByValue(upc, context)) !== null;
  }

  async reserve(
    upc: string,
    actorId: string,
    _context: PersistenceContext,
  ): Promise<UPCRegistryEntry> {
    try {
      const { data, error } = await this.client.rpc(METADATA_RPC.RESERVE_UPC, {
        p_upc: upc,
        p_actor_id: actorId,
      });
      if (error) throw error;
      if (!data) throw new NotFoundError();
      return rowToEntry(data as UPCRow);
    } catch (e) {
      throw mapVendorError(e);
    }
  }

  async release(upc: string, context: PersistenceContext): Promise<UPCRegistryEntry> {
    const entry = await this.findByValue(upc, context);
    if (!entry) throw new NotFoundError();
    return this.saveEntry(
      { ...entry, status: "available", updatedAt: new Date().toISOString() },
      context,
    );
  }

  async search(
    filter: Readonly<Record<string, unknown>>,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly UPCRegistryEntry[]> {
    try {
      let query = fromTable(this.client, METADATA_TABLES.UPC_REGISTRY).select("*");
      if (filter.status) query = query.eq("status", filter.status);
      query = applyPagination(query, options);
      const { data, error } = await query;
      if (error) throw error;
      return ((data as UPCRow[]) ?? []).map(rowToEntry);
    } catch (e) {
      throw mapVendorError(e);
    }
  }
}
