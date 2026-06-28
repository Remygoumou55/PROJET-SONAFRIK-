import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";

/** Audiences — extensible (label, manager, producer…). */
export type MusicalIdentityAudience = "all" | "listener" | "artist";

/**
 * Source de données — prépare l'évolution automatique future sans l'implémenter.
 * profile_static = profil utilisateur · published_tracks = catalogue · etc.
 */
export type IdentityEvolutionSource =
  | "profile_static"
  | "published_tracks"
  | "listened_genres"
  | "collaborations"
  | "playlists"
  | "followed_artists"
  | "interactions"
  | "ai_recommendations";

export type IdentityDimensionGroup =
  | "roots"
  | "sound"
  | "craft"
  | "community"
  | "vision";

export interface MusicalIdentityContext {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export interface MusicalIdentityValue {
  id: string;
  label: string;
  /** Variante visuelle — ex. racines guinéennes mises en avant. */
  variant?: "default" | "guinea" | "accent";
}

export interface MusicalIdentityDimensionDefinition {
  id: string;
  label: string;
  icon: string;
  group: IdentityDimensionGroup;
  audience: MusicalIdentityAudience;
  order: number;
  evolutionSource: IdentityEvolutionSource;
  emptyHint: string;
  resolve: (ctx: MusicalIdentityContext) => MusicalIdentityValue[];
}

export interface MusicalIdentityPillViewModel {
  id: string;
  label: string;
  variant: "default" | "guinea" | "accent" | "placeholder";
}

export interface MusicalIdentityDimensionViewModel {
  id: string;
  label: string;
  icon: string;
  evolutionSource: IdentityEvolutionSource;
  isFilled: boolean;
  emptyHint: string;
  pills: MusicalIdentityPillViewModel[];
  ariaLabel: string;
}

export interface MusicalIdentityGroupViewModel {
  id: IdentityDimensionGroup;
  title: string;
  icon: string;
  dimensions: MusicalIdentityDimensionViewModel[];
}

export interface MusicalIdentityViewModel {
  completenessPercent: number;
  filledCount: number;
  totalCount: number;
  tagline: string;
  subtitle: string;
  guineaHighlight: string | null;
  groups: MusicalIdentityGroupViewModel[];
}
