import type {
  ISRCRegistryEntry,
  ISRCRegistryStatus,
  ISRCSequenceKey,
  ISRCSequenceState,
  ISRCValue,
} from "@sonafrik/types";
import type { PersistenceContext, PersistenceQueryOptions } from "@sonafrik/types";
import type {
  ISRCPersistenceRepository,
  ISRCSequencePersistenceRepository,
} from "../../contracts/isrc.repository";
import { mapVendorError, NotFoundError } from "../../errors/persistence-errors";
import {
  METADATA_RPC,
  METADATA_TABLES,
  type SupabaseClientPort,
} from "./supabase-client.port";
import { applyPagination, fromTable, runQuery, runQueryNullable, runVoidQuery } from "./supabase-query.helpers";

interface ISRCRow {
  isrc: string;
  status: string;
  metadata_id: string | null;
  track_id: string | null;
  reserved_by: string | null;
  reserved_at: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
}

interface SequenceRow {
  country_code: string;
  registrant_code: string;
  year_of_reference: string;
  last_designation: number;
  updated_at: string;
}

function rowToEntry(row: ISRCRow): ISRCRegistryEntry {
  return {
    isrc: row.isrc as ISRCValue,
    status: row.status as ISRCRegistryStatus,
    metadataId: row.metadata_id as ISRCRegistryEntry["metadataId"],
    trackId: row.track_id as ISRCRegistryEntry["trackId"],
    reservedBy: row.reserved_by,
    reservedAt: row.reserved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function entryToRow(entry: ISRCRegistryEntry): Record<string, unknown> {
  return {
    isrc: entry.isrc as string,
    status: entry.status,
    metadata_id: entry.metadataId as string | null,
    track_id: entry.trackId as string | null,
    reserved_by: entry.reservedBy,
    reserved_at: entry.reservedAt,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

function rowToSequenceState(row: SequenceRow): ISRCSequenceState {
  return {
    key: {
      countryCode: row.country_code,
      registrantCode: row.registrant_code,
      yearOfReference: row.year_of_reference,
    },
    lastDesignation: row.last_designation,
    updatedAt: row.updated_at,
  };
}

/** Supabase ISRC adapter — translation only */
export class SupabaseISRCRepositoryAdapter implements ISRCPersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async saveEntry(
    entry: ISRCRegistryEntry,
    _context: PersistenceContext,
  ): Promise<ISRCRegistryEntry> {
    const data = await runQuery<ISRCRow>(() =>
      fromTable(this.client, METADATA_TABLES.ISRC_REGISTRY)
        .upsert(entryToRow(entry))
        .select()
        .single(),
    );
    return rowToEntry(data);
  }

  async findByValue(
    isrc: ISRCValue,
    _context: PersistenceContext,
  ): Promise<ISRCRegistryEntry | null> {
    const data = await runQueryNullable<ISRCRow>(() =>
      fromTable(this.client, METADATA_TABLES.ISRC_REGISTRY)
        .select("*")
        .eq("isrc", isrc as string)
        .maybeSingle(),
    );
    return data ? rowToEntry(data) : null;
  }

  async findByStatus(
    status: ISRCRegistryStatus,
    _context: PersistenceContext,
    options?: PersistenceQueryOptions,
  ): Promise<readonly ISRCRegistryEntry[]> {
    try {
      const query = applyPagination(
        fromTable(this.client, METADATA_TABLES.ISRC_REGISTRY).select("*").eq("status", status),
        options,
      );
      const { data, error } = await query;
      if (error) throw error;
      return ((data as ISRCRow[]) ?? []).map(rowToEntry);
    } catch (e) {
      throw mapVendorError(e);
    }
  }

  async exists(isrc: ISRCValue, context: PersistenceContext): Promise<boolean> {
    return (await this.findByValue(isrc, context)) !== null;
  }

  async deleteEntry(isrc: ISRCValue, _context: PersistenceContext): Promise<void> {
    await runVoidQuery(() =>
      fromTable(this.client, METADATA_TABLES.ISRC_REGISTRY)
        .delete()
        .eq("isrc", isrc as string),
    );
  }

  async reserve(
    isrc: ISRCValue,
    actorId: string,
    _context: PersistenceContext,
  ): Promise<ISRCRegistryEntry> {
    try {
      const { data, error } = await this.client.rpc(METADATA_RPC.RESERVE_ISRC, {
        p_isrc: isrc as string,
        p_actor_id: actorId,
      });
      if (error) throw error;
      if (!data) throw new NotFoundError();
      return rowToEntry(data as ISRCRow);
    } catch (e) {
      throw mapVendorError(e);
    }
  }

  async release(isrc: ISRCValue, _context: PersistenceContext): Promise<ISRCRegistryEntry> {
    const entry = await this.findByValue(isrc, _context);
    if (!entry) throw new NotFoundError();
    return this.saveEntry(
      {
        ...entry,
        status: "available" as ISRCRegistryStatus,
        reservedBy: null,
        reservedAt: null,
        updatedAt: new Date().toISOString(),
      },
      _context,
    );
  }

  async archive(isrc: ISRCValue, _context: PersistenceContext): Promise<void> {
    const entry = await this.findByValue(isrc, _context);
    if (!entry) throw new NotFoundError();
    await this.saveEntry(
      { ...entry, status: "archived" as ISRCRegistryStatus, updatedAt: new Date().toISOString() },
      _context,
    );
  }
}

/** Supabase ISRC sequence adapter — uses atomic RPC */
export class SupabaseISRCSequenceRepositoryAdapter implements ISRCSequencePersistenceRepository {
  constructor(private readonly client: SupabaseClientPort) {}

  async getState(
    key: ISRCSequenceKey,
    _context: PersistenceContext,
  ): Promise<ISRCSequenceState | null> {
    const data = await runQueryNullable<SequenceRow>(() =>
      fromTable(this.client, METADATA_TABLES.ISRC_SEQUENCE)
        .select("*")
        .eq("country_code", key.countryCode)
        .eq("registrant_code", key.registrantCode)
        .eq("year_of_reference", key.yearOfReference)
        .maybeSingle(),
    );
    return data ? rowToSequenceState(data) : null;
  }

  async saveState(
    state: ISRCSequenceState,
    _context: PersistenceContext,
  ): Promise<ISRCSequenceState> {
    const row = {
      country_code: state.key.countryCode,
      registrant_code: state.key.registrantCode,
      year_of_reference: state.key.yearOfReference,
      last_designation: state.lastDesignation,
      updated_at: state.updatedAt,
    };
    const data = await runQuery<SequenceRow>(() =>
      fromTable(this.client, METADATA_TABLES.ISRC_SEQUENCE).upsert(row).select().single(),
    );
    return rowToSequenceState(data);
  }

  async advance(key: ISRCSequenceKey, _context: PersistenceContext): Promise<ISRCSequenceState> {
    try {
      const { data, error } = await this.client.rpc(METADATA_RPC.ADVANCE_ISRC_SEQUENCE, {
        p_country_code: key.countryCode,
        p_registrant_code: key.registrantCode,
        p_year_of_reference: key.yearOfReference,
      });
      if (error) throw error;
      const rows = data as SequenceRow[] | SequenceRow;
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) throw new NotFoundError("Sequence advance failed");
      return rowToSequenceState(row);
    } catch (e) {
      throw mapVendorError(e);
    }
  }
}
