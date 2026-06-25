import { describe, expect, it } from "vitest";
import {
  ConflictError,
  DuplicateError,
  NotFoundError,
  PersistenceNotReadyError,
  mapVendorError,
} from "../errors/persistence-errors";

describe("mapVendorError", () => {
  it("maps duplicate errors", () => {
    expect(mapVendorError(new Error("unique violation 23505"))).toBeInstanceOf(DuplicateError);
  });

  it("maps not found", () => {
    expect(mapVendorError(new Error("PGRST116 not found"))).toBeInstanceOf(NotFoundError);
  });

  it("maps missing table to not ready", () => {
    expect(
      mapVendorError(new Error('relation "metadata_isrc_registry" does not exist')),
    ).toBeInstanceOf(PersistenceNotReadyError);
  });

  it("maps conflict", () => {
    expect(mapVendorError(new Error("version conflict"))).toBeInstanceOf(ConflictError);
  });
});
