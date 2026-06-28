import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";

export type StoryAudience = "all" | "listener" | "artist";

export type StorySectionGroup = "narrative" | "roots";

/** Prépare chronologie, médias, traductions — sans les implémenter. */
export type StoryEvolutionSource =
  | "profile_static"
  | "user_draft"
  | "timeline"
  | "media"
  | "translation"
  | "collaboration";

export interface StoryContext {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export interface StorySectionDefinition {
  id: string;
  title: string;
  icon: string;
  group: StorySectionGroup;
  audience: StoryAudience;
  order: number;
  evolutionSource: StoryEvolutionSource;
  emptyHint: string;
  editPlaceholder: string;
  resolveFromProfile: (ctx: StoryContext) => string | null;
}

export interface StorySectionViewModel {
  id: string;
  title: string;
  icon: string;
  group: StorySectionGroup;
  groupLabel: string;
  content: string;
  profileContent: string;
  isFilled: boolean;
  emptyHint: string;
  editPlaceholder: string;
  evolutionSource: StoryEvolutionSource;
  ariaLabel: string;
}

export interface StoryEngineViewModel {
  filledCount: number;
  totalCount: number;
  tagline: string;
  subtitle: string;
  narrativeSections: StorySectionViewModel[];
  rootsSections: StorySectionViewModel[];
  visibleSections: StorySectionViewModel[];
  allSections: StorySectionViewModel[];
}

export type StoryDraftStorage = Record<string, string>;

export const STORY_STORAGE_KEY_PREFIX = "sonafrik-profile-story-v1";

export function getStoryStorageKey(userId: string): string {
  return `${STORY_STORAGE_KEY_PREFIX}:${userId}`;
}
