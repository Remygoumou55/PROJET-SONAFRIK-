import { describe, expect, it, vi } from "vitest";
import { MetadataRepositoryFactory } from "../factory/metadata-repository-factory";
import { PersistenceContainer } from "../di/container";
import { SupabaseISRCRepositoryAdapter } from "../adapters/supabase/supabase-isrc.adapter";
import { SupabaseMetadataRepositoryAdapter } from "../adapters/supabase/supabase-metadata.adapter";
import { SupabaseUPCRepositoryAdapter } from "../adapters/supabase/supabase-upc.adapter";
import { SupabaseRegistryRepositoryAdapter } from "../adapters/supabase/supabase-registry.adapter";
import { SupabaseAuditRepositoryAdapter } from "../adapters/supabase/supabase-audit.adapter";
import { InMemoryTransactionManager } from "../core/transaction-manager";

describe("MetadataRepositoryFactory", () => {
  it("creates in-memory bundle", () => {
    const bundle = MetadataRepositoryFactory.createInMemory();
    expect(bundle.isrc).toBeDefined();
    expect(bundle.metadata).toBeDefined();
    expect(bundle.registry).toBeDefined();
  });

  it("creates supabase bundle with client port", () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            isrc: "GNSFK2400001",
            status: "available",
            metadata_id: null,
            track_id: null,
            reserved_by: null,
            reserved_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnThis(),
      }),
    };
    const bundle = MetadataRepositoryFactory.create({
      provider: "supabase",
      supabaseClient: mockClient,
    });
    expect(bundle.isrc).toBeInstanceOf(SupabaseISRCRepositoryAdapter);
    expect(bundle.metadata).toBeInstanceOf(SupabaseMetadataRepositoryAdapter);
    expect(bundle.upc).toBeInstanceOf(SupabaseUPCRepositoryAdapter);
    expect(bundle.registry).toBeInstanceOf(SupabaseRegistryRepositoryAdapter);
    expect(bundle.audit).toBeInstanceOf(SupabaseAuditRepositoryAdapter);
  });

  it("throws without supabase client", () => {
    expect(() =>
      MetadataRepositoryFactory.create({ provider: "supabase" }),
    ).toThrow();
  });
});

describe("PersistenceContainer", () => {
  it("injects repositories and transaction manager", () => {
    const container = new PersistenceContainer({ provider: "memory" });
    expect(container.getRepositories().isrc).toBeDefined();
    expect(container.getTransactionManager()).toBeInstanceOf(InMemoryTransactionManager);
    expect(container.getProvider()).toBe("memory");
  });
});

describe("InMemoryTransactionManager", () => {
  it("commits successful transaction", async () => {
    const container = new PersistenceContainer({ provider: "memory" });
    const tx = container.getTransactionManager();
    const ctx = { actorId: "a", correlationId: "c", initiatedAt: new Date().toISOString() };
    const result = await tx.runInTransaction(async () => 42, ctx);
    expect(result).toBe(42);
  });
});
