import { describe, expect, it } from "vitest";
import { MetadataAutomaticEngine } from "./metadata-automatic.engine";

const BASE_CTX = {
  creatorId: "849836a7-d234-4c11-b8af-a65a53bfc525",
  userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  stageName: "Dev Artiste",
  validatedAt: new Date("2026-07-04T15:30:00.000Z"),
};

describe("MetadataAutomaticEngine", () => {
  it("buildWizardTrackPatch — genre + langue utilisateur, explicit false", () => {
    const engine = new MetadataAutomaticEngine(BASE_CTX);
    const patch = engine.buildWizardTrackPatch({
      trackId: "11111111-1111-4111-8111-111111111111",
      genreId: "22222222-2222-4222-8222-222222222222",
      language: "fr",
    });
    expect(patch.trackUpdate.language).toBe("fr");
    expect(patch.trackUpdate.explicit).toBe(false);
    expect(patch.trackUpdate.genreIds).toEqual(["22222222-2222-4222-8222-222222222222"]);
  });

  it("buildAutomaticCredits — auteur/compositeur/producteur = stageName", () => {
    const engine = new MetadataAutomaticEngine(BASE_CTX);
    const credits = engine.buildAutomaticCredits();
    expect(credits).toHaveLength(3);
    expect(credits.every((c) => c.contributorName === "Dev Artiste")).toBe(true);
    expect(credits.map((c) => c.role)).toEqual(["auteur", "compositeur", "producteur"]);
  });

  it("buildPublicationAlbumPatch — date = validatedAt, pas now() implicite ailleurs", () => {
    const engine = new MetadataAutomaticEngine(BASE_CTX);
    const pub = engine.buildPublicationAlbumPatch();
    expect(pub.releaseDateIso).toBe("2026-07-04");
    expect(pub.albumUpdate.releaseDate).toBe("2026-07-04");
    expect(pub.publishedAtIso).toBe("2026-07-04T15:30:00.000Z");
  });

  it("buildSystemIdentity — creatorId + userId", () => {
    const engine = new MetadataAutomaticEngine(BASE_CTX);
    expect(engine.buildSystemIdentity()).toEqual({
      creatorId: BASE_CTX.creatorId,
      userId: BASE_CTX.userId,
    });
  });
});
