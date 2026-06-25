import { describe, expect, it, vi } from "vitest";
import type { SupabaseClientPort } from "./supabase-client.port";
import { SupabaseMetadataRepositoryAdapter } from "./supabase-metadata.adapter";
import { SupabaseUPCRepositoryAdapter } from "./supabase-upc.adapter";
import { SupabaseRegistryRepositoryAdapter } from "./supabase-registry.adapter";
import { SupabaseAuditRepositoryAdapter } from "./supabase-audit.adapter";
import { SupabaseVersionRepositoryAdapter } from "./supabase-version.adapter";
import { SupabaseReleaseRepositoryAdapter } from "./supabase-release.adapter";
import { SupabaseFingerprintRepositoryAdapter } from "./supabase-fingerprint.adapter";
import { SupabaseISRCSequenceRepositoryAdapter } from "./supabase-isrc.adapter";
import type { PersistenceContext } from "@sonafrik/types";

const ctx: PersistenceContext = {
  actorId: "actor-1",
  correlationId: "corr",
  initiatedAt: new Date().toISOString(),
};

function createMockClient(initialRow: Record<string, unknown> = {}): SupabaseClientPort {
  const row = { ...initialRow };
  const builder = {
    upsert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      Object.assign(row, payload);
      return builder;
    }),
    insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      Object.assign(row, payload);
      return builder;
    }),
    update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      Object.assign(row, payload);
      return builder;
    }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: { ...row }, error: null })),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: Object.keys(row).length ? { ...row } : null, error: null }),
    ),
    delete: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [{ ...row }], error: null })),
  };
  return {
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockImplementation((_fn, params) => {
      Object.assign(row, params ?? {});
      return Promise.resolve({ data: [{ ...row }], error: null });
    }),
  };
}

describe("Supabase adapters — full coverage", () => {
  it("metadata adapter save and findById", async () => {
    const client = createMockClient();
    const adapter = new SupabaseMetadataRepositoryAdapter(client);
    const record = {
      id: "meta-1",
      trackId: "track-1",
      title: "T",
      isrc: null,
      durationSeconds: 1,
      language: null,
      explicit: false,
      genreIds: [],
      status: "draft",
      source: "system",
      visibility: "private",
      validationState: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    const saved = await adapter.save(record, ctx);
    expect(saved.id).toBe("meta-1");
    const found = await adapter.findById("meta-1" as typeof record.id, ctx);
    expect(found?.id).toBe("meta-1");
    const track = await adapter.findTrackMetadata("track-1", ctx);
    expect(track?.trackId).toBe("track-1");
    await adapter.archive("meta-1" as typeof record.id, ctx);
    const results = await adapter.search({ status: "draft" }, ctx, { limit: 10 });
    expect(results.length).toBeGreaterThan(0);
  });

  it("upc adapter save and reserve via rpc", async () => {
    const client = createMockClient({
      upc: "012345678905",
      status: "available",
      album_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const adapter = new SupabaseUPCRepositoryAdapter(client);
    const entry = {
      upc: "012345678905",
      status: "available" as const,
      albumId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await adapter.saveEntry(entry, ctx);
    await adapter.reserve("012345678905", "actor-1", ctx);
    expect(client.rpc).toHaveBeenCalled();
  });

  it("registry adapter register and lookup", async () => {
    const client = createMockClient({
      identifier_type: "isrc",
      identifier_value: "GNSFK2400001",
      metadata_id: "meta-1",
    });
    const adapter = new SupabaseRegistryRepositoryAdapter(client);
    await adapter.registerIsrc("GNSFK2400001" as never, "meta-1" as never, ctx);
    const id = await adapter.lookupByIsrc("GNSFK2400001" as never, ctx);
    expect(id).toBe("meta-1");
  });

  it("audit adapter append", async () => {
    const client = createMockClient({
      id: "a1",
      audit_metadata_id: "audit-1",
      actor_id: "actor-1",
      action: "create",
      entity_type: "track",
      entity_id: "t1",
      payload: {},
      status: "validated",
      source: "system",
      visibility: "private",
      validation_state: "valid",
      row_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const adapter = new SupabaseAuditRepositoryAdapter(client);
    const result = await adapter.append(
      {
        id: "a1" as never,
        auditMetadataId: "audit-1" as never,
        actorId: "actor-1",
        action: "create",
        entityType: "track",
        entityId: "t1",
        payload: {},
        status: "validated",
        source: "system",
        visibility: "private",
        validationState: "valid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      ctx,
    );
    expect(result.auditMetadataId).toBe("audit-1");
  });

  it("version adapter save and restore", async () => {
    const client = createMockClient({
      version_id: "v1",
      entity_type: "track",
      entity_id: "t1",
      action: "update",
      snapshot: { title: "X" },
      status: "validated",
      source: "system",
      visibility: "private",
      validation_state: "valid",
      row_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const adapter = new SupabaseVersionRepositoryAdapter(client);
    const snap = {
      id: "v1" as never,
      versionId: "v1" as never,
      entityType: "track" as const,
      entityId: "t1",
      action: "update" as const,
      snapshot: { title: "X" },
      status: "validated" as const,
      source: "system" as const,
      visibility: "private" as const,
      validationState: "valid" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await adapter.save(snap, ctx);
    const restored = await adapter.restore("v1" as never, ctx);
    expect(restored.versionId).toBe("v1");
  });

  it("release adapter save and archive", async () => {
    const release = {
      id: "r1" as never,
      releaseId: "r1" as never,
      albumId: null,
      trackIds: [],
      releaseType: "single" as const,
      releaseDate: null,
      territoryCodes: [],
      status: "draft" as const,
      source: "system" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    const client = createMockClient({
      release_id: "r1",
      payload: release,
      status: "draft",
      row_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    });
    const adapter = new SupabaseReleaseRepositoryAdapter(client);
    await adapter.save(release, ctx);
    await adapter.archive("r1" as never, ctx);
    expect(client.from).toHaveBeenCalled();
  });

  it("fingerprint adapter save and findByHash", async () => {
    const fp = {
      id: "f1" as never,
      fingerprintId: "f1" as never,
      trackId: "t1" as never,
      fingerprintStatus: "pending" as const,
      hash: "abc123",
      duplicateTrackId: null,
      status: "draft" as const,
      source: "system" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    const client = createMockClient({
      fingerprint_id: "f1",
      track_id: "t1",
      hash: "abc123",
      payload: fp,
      status: "draft",
      row_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    });
    const adapter = new SupabaseFingerprintRepositoryAdapter(client);
    await adapter.save(fp, ctx);
    const matches = await adapter.findByHash("abc123", ctx);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("sequence adapter advance via rpc", async () => {
    const client = createMockClient({
      country_code: "GN",
      registrant_code: "SFK",
      year_of_reference: "24",
      last_designation: 1,
      updated_at: new Date().toISOString(),
    });
    const adapter = new SupabaseISRCSequenceRepositoryAdapter(client);
    const state = await adapter.advance(
      { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" },
      ctx,
    );
    expect(state.lastDesignation).toBe(1);
  });
});
