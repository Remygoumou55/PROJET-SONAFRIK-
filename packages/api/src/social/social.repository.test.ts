import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const REPO_SRC = readFileSync(resolve(__dirname, "social.repository.ts"), "utf8");

describe("SocialRepository — séparation like vs favorite (Vague C1)", () => {
  it("toggleLike appelle toggle_like, pas toggle_favorite", () => {
    const toggleLikeBlock = REPO_SRC.match(/async toggleLike[\s\S]*?async toggleFavorite/)?.[0] ?? "";
    expect(toggleLikeBlock).toContain('rpc("toggle_like"');
    expect(toggleLikeBlock).not.toContain("toggle_favorite");
  });

  it("isLiked appelle is_liked, pas is_favorited", () => {
    const isLikedBlock = REPO_SRC.match(/async isLiked[\s\S]*?async getLikeCount/)?.[0] ?? "";
    expect(isLikedBlock).toContain('rpc("is_liked"');
    expect(isLikedBlock).not.toContain("is_favorited");
  });

  it("toggleFavorite conserve toggle_favorite pour la bibliothèque", () => {
    const favBlock = REPO_SRC.match(/async toggleFavorite[\s\S]*?async isFavorited/)?.[0] ?? "";
    expect(favBlock).toContain('rpc("toggle_favorite"');
  });
});
