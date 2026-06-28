import type { IdentityDimensionGroup } from "./types";

export const IDENTITY_GROUP_LABELS: Record<
  IdentityDimensionGroup,
  { title: string; icon: string }
> = {
  roots: { title: "Racines & territoire", icon: "🌍" },
  sound: { title: "Univers sonore", icon: "🎵" },
  craft: { title: "Artisanat musical", icon: "🎸" },
  community: { title: "Communauté", icon: "❤️" },
  vision: { title: "Vision artistique", icon: "✨" },
};

/** Langues nationales guinéennes — extensible aux autres pays africains. */
export const GUINEAN_NATIONAL_LANGUAGE_CODES = new Set(["ss", "ff", "man"]);

/** Codes pays prioritaires SONAFRIK — Guinée first. */
export const SONAFRIK_ROOT_COUNTRY_CODES = new Set(["GN"]);

export function getIdentityGroupMeta(group: IdentityDimensionGroup): {
  title: string;
  icon: string;
} {
  return IDENTITY_GROUP_LABELS[group];
}
