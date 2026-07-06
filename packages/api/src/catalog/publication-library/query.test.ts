import { describe, expect, it } from "vitest";
import {
  normalizePublicationSort,
  parsePublicationLibraryQuery,
  publicationSortToOrder,
} from "./query";

describe("publication-library query", () => {
  it("parsePublicationLibraryQuery — defaults", () => {
    const q = parsePublicationLibraryQuery({ page: 1, pageSize: 50 });
    expect(q.status).toBe("all");
    expect(q.sort).toBe("updated_desc");
    expect(q.offset).toBe(0);
  });

  it("normalizePublicationSort — alias UI", () => {
    expect(normalizePublicationSort("title")).toBe("title_asc");
    expect(normalizePublicationSort("updated")).toBe("updated_desc");
  });

  it("publicationSortToOrder", () => {
    expect(publicationSortToOrder("title_asc")).toEqual({ column: "title", ascending: true });
    expect(publicationSortToOrder("updated_desc")).toEqual({ column: "updated_at", ascending: false });
  });
});
