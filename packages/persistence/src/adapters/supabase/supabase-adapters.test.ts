import { describe, expect, it, vi } from "vitest";
import { SupabaseHealthProbe, createSupabaseClientPort } from "./supabase-health";
import { SupabaseISRCRepositoryAdapter } from "./supabase-isrc.adapter";
import { brandISRC } from "../memory/helpers-isrc";
import type { PersistenceContext } from "@sonafrik/types";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";

const ctx: PersistenceContext = {
  actorId: "test",
  correlationId: "corr",
  initiatedAt: new Date().toISOString(),
};

function createMockClient() {
  const row = {
    isrc: "GNSFK2400001",
    status: "available",
    metadata_id: null,
    track_id: null,
    reserved_by: null,
    reserved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const builder = {
    upsert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      Object.assign(row, payload);
      return builder;
    }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: { ...row }, error: null })),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: { ...row }, error: null })),
    delete: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [{ ...row }], error: null })),
  };
  return {
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockImplementation((_fn: string, params: Record<string, unknown>) => {
      if (params.p_actor_id) {
        Object.assign(row, {
          status: "reserved",
          reserved_by: params.p_actor_id,
          reserved_at: new Date().toISOString(),
        });
      }
      return Promise.resolve({ data: { ...row }, error: null });
    }),
    builder,
    row,
  };
}

describe("SupabaseISRCRepositoryAdapter", () => {
  it("maps rows to domain entries on save", async () => {
    const mock = createMockClient();
    const adapter = new SupabaseISRCRepositoryAdapter(mock);
    const isrc = brandISRC("GNSFK2400001");
    const saved = await adapter.saveEntry(
      {
        isrc,
        status: ISRC_REGISTRY_STATUS.AVAILABLE,
        metadataId: null,
        trackId: null,
        reservedBy: null,
        reservedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ctx,
    );
    expect(saved.isrc).toBe(isrc);
    expect(mock.from).toHaveBeenCalledWith("metadata_isrc_registry");
  });

  it("returns null when ISRC not found", async () => {
    const mock = createMockClient();
    mock.builder.maybeSingle.mockResolvedValue({ data: null, error: null });
    const adapter = new SupabaseISRCRepositoryAdapter(mock);
    expect(await adapter.findByValue(brandISRC("GNSFK2400002"), ctx)).toBeNull();
  });

  it("reserve, release, archive lifecycle", async () => {
    const mock = createMockClient();
    const adapter = new SupabaseISRCRepositoryAdapter(mock);
    const isrc = brandISRC("GNSFK2400001");
    const reserved = await adapter.reserve(isrc, "actor", ctx);
    expect(reserved.status).toBe("reserved");
    const released = await adapter.release(isrc, ctx);
    expect(released.status).toBe("available");
    await adapter.archive(isrc, ctx);
    expect(mock.from).toHaveBeenCalled();
  });
});

describe("SupabaseHealthProbe", () => {
  it("reports healthy when probe succeeds", async () => {
    const mock = createMockClient();
    const probe = new SupabaseHealthProbe(mock);
    const status = await probe.checkHealth();
    expect(status.healthy).toBe(true);
    expect(status.provider).toBe("supabase");
  });

  it("reports unhealthy on probe error", async () => {
    const mock = createMockClient();
    mock.builder.maybeSingle.mockResolvedValue({ data: null, error: { message: "down" } });
    const probe = new SupabaseHealthProbe(mock);
    const status = await probe.checkHealth();
    expect(status.healthy).toBe(false);
    expect(status.message).toBeTruthy();
  });
});

describe("createSupabaseClientPort", () => {
  it("wraps client.from as port", () => {
    const inner = createMockClient();
    const port = createSupabaseClientPort(inner);
    expect(port.from("metadata_isrc_registry")).toBeDefined();
  });
});
