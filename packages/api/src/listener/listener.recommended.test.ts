import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const REPO_SRC = readFileSync(
  resolve(__dirname, "listener.track.repository.ts"),
  "utf8",
);
const SERVICE_SRC = readFileSync(
  resolve(__dirname, "listener.service.ts"),
  "utf8",
);

describe("ListenerRepository — getRecommendedTracks (Recommendation Engine MVP)", () => {
  it("appelle get_recommended_tracks_mvp via rpc", () => {
    const block = REPO_SRC.match(/async getRecommendedTracks[\s\S]*?\n {2}\}/)?.[0] ?? "";
    expect(block).toContain('rpc("get_recommended_tracks_mvp"');
  });

  it("passe p_limit en argument", () => {
    const block = REPO_SRC.match(/async getRecommendedTracks[\s\S]*?\n {2}\}/)?.[0] ?? "";
    expect(block).toContain("p_limit");
  });

  it("n'utilise plus de cast as never (types générés)", () => {
    const block = REPO_SRC.match(/async getRecommendedTracks[\s\S]*?\n {2}\}/)?.[0] ?? "";
    expect(block).not.toContain("as never");
  });

  it("mappe le champ reason sur le type RecommendedTrack", () => {
    const block = REPO_SRC.match(/async getRecommendedTracks[\s\S]*?\n {2}\}/)?.[0] ?? "";
    expect(block).toContain("reason");
    expect(block).toContain("recommendation_score");
  });
});

describe("ListenerService — délégation getRecommendedTracks", () => {
  it("délègue à this.repository.getRecommendedTracks", () => {
    const block = SERVICE_SRC.match(/getRecommendedTracks[\s\S]*?\}/)?.[0] ?? "";
    expect(block).toContain("repository.getRecommendedTracks");
  });
});
