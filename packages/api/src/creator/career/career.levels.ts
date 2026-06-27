import type { CreatorCareerLevel } from "@sonafrik/types";
import type { CareerEngineContext } from "./career.missions";

export type CareerLevelDefinition = {
  id: string;
  label: string;
  icon: string;
  isUnlocked: (ctx: CareerEngineContext) => boolean;
};

export const CAREER_LEVEL_DEFINITIONS: CareerLevelDefinition[] = [
  {
    id: "launch",
    label: "En lancement",
    icon: "🌱",
    isUnlocked: () => true,
  },
  {
    id: "new_creator",
    label: "Nouveau créateur",
    icon: "🎙",
    isUnlocked: (ctx) => ctx.profilePercent >= 40,
  },
  {
    id: "first_artist",
    label: "Premier artiste",
    icon: "🎵",
    isUnlocked: (ctx) => ctx.tracksPublished >= 1,
  },
  {
    id: "growing",
    label: "Artiste en croissance",
    icon: "🔥",
    isUnlocked: (ctx) => ctx.totalStreams >= 100 || ctx.totalFollowers >= 5,
  },
  {
    id: "confirmed",
    label: "Artiste confirmé",
    icon: "⭐",
    isUnlocked: (ctx) =>
      ctx.verified && ctx.paymentConfigured && ctx.tracksPublished >= 1,
  },
  {
    id: "popular",
    label: "Artiste populaire",
    icon: "🏆",
    isUnlocked: (ctx) => ctx.totalStreams >= 1000,
  },
  {
    id: "influential",
    label: "Artiste influent",
    icon: "🚀",
    isUnlocked: (ctx) => ctx.totalStreams >= 10_000 || ctx.totalFollowers >= 100,
  },
  {
    id: "icon",
    label: "Icône SONAFRIK",
    icon: "👑",
    isUnlocked: (ctx) =>
      ctx.totalStreams >= 100_000 ||
      (ctx.totalFollowers >= 1000 && ctx.albumsPublished >= 1),
  },
];

export function resolveCareerLevels(ctx: CareerEngineContext): CreatorCareerLevel[] {
  const unlockedLevels = CAREER_LEVEL_DEFINITIONS.filter((level) => level.isUnlocked(ctx));
  const currentId = unlockedLevels[unlockedLevels.length - 1]?.id ?? "launch";

  return CAREER_LEVEL_DEFINITIONS.map((level) => ({
    id: level.id,
    label: level.label,
    icon: level.icon,
    unlocked: level.isUnlocked(ctx),
    isCurrent: level.id === currentId,
  }));
}

export function resolveCurrentLevel(levels: CreatorCareerLevel[]): CreatorCareerLevel {
  return levels.find((l) => l.isCurrent) ?? levels[0]!;
}
