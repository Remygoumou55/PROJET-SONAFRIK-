import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  process.cwd(),
  "../../supabase/migrations/20260624220000_metadata_platform_infrastructure.sql",
);

describe("metadata platform migration — RLS certification", () => {
  const sql = readFileSync(MIGRATION, "utf-8");

  const tables = [
    "metadata_platform_health",
    "metadata_records",
    "metadata_isrc_registry",
    "metadata_isrc_sequence",
    "metadata_upc_registry",
    "metadata_registry_index",
    "metadata_audit_log",
    "metadata_version_snapshots",
    "metadata_release_records",
    "metadata_fingerprint_records",
  ];

  it.each(tables)("enables RLS on %s", (table) => {
    expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
  });

  it("defines atomic ISRC sequence RPC", () => {
    expect(sql).toContain("metadata_advance_isrc_sequence");
    expect(sql).toContain("ON CONFLICT (country_code, registrant_code, year_of_reference)");
  });

  it("defines conditional ISRC reserve RPC", () => {
    expect(sql).toContain("metadata_reserve_isrc");
    expect(sql).toContain("AND status = 'available'");
  });

  it("restricts ISRC registry to admin", () => {
    expect(sql).toContain("metadata_isrc_admin_all");
    expect(sql).toContain("is_admin(auth.uid())");
  });

  it("audit log is append-only (no update/delete policies)", () => {
    expect(sql).toContain("metadata_audit_insert");
    expect(sql).not.toMatch(/metadata_audit.*FOR UPDATE/i);
    expect(sql).not.toMatch(/metadata_audit.*FOR DELETE/i);
  });

  it("uses non-destructive pattern only", () => {
    expect(sql).not.toMatch(/DROP TABLE/i);
    expect(sql).not.toMatch(/ALTER TABLE.*DROP/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS/i);
  });
});
