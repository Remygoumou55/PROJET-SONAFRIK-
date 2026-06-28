import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";

/** Audiences — extensible sans refactor UI. */
export type DnaAudience = "all" | "listener" | "artist" | "label" | "manager" | "producer" | "organizer" | "admin";

/** Catégories de répartition ADN — extensible. */
export type DnaSegmentCategory =
  | "genre"
  | "language"
  | "region"
  | "style"
  | "influence";

/** Type de visualisation — plusieurs rendus possibles côté UI. */
export type DnaVisualizationKind = "bar" | "ring" | "stack" | "radial";

/**
 * Sources futures — l'ADN sera recalculé automatiquement sans changer l'UI.
 * listen_history · published_catalog · playlists · interactions · ai_inference …
 */
export type DnaEvolutionSource =
  | "profile_static"
  | "listen_history"
  | "published_catalog"
  | "playlists"
  | "collaborations"
  | "interactions"
  | "likes"
  | "shares"
  | "followed_artists"
  | "concerts"
  | "searches"
  | "goals"
  | "rewards"
  | "journey"
  | "coach"
  | "identity"
  | "story"
  | "ai_inference";

export type DnaSliceVariant = "default" | "guinea" | "accent" | "emerging" | "placeholder";

export interface MusicalDnaContext {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
  publishedTracks: number;
  publishedAlbums: number;
}

export interface DnaSliceDefinition {
  id: string;
  label: string;
  weight: number;
  variant?: DnaSliceVariant;
}

export interface DnaCategoryDefinition {
  id: string;
  category: DnaSegmentCategory;
  title: string;
  icon: string;
  audience: DnaAudience;
  order: number;
  evolutionSource: DnaEvolutionSource;
  visualizationKind: DnaVisualizationKind;
  resolve: (ctx: MusicalDnaContext) => DnaSliceDefinition[];
}

export interface DnaSliceViewModel {
  id: string;
  label: string;
  weight: number;
  variant: DnaSliceVariant;
  ariaLabel: string;
}

export interface DnaCategoryViewModel {
  id: string;
  category: DnaSegmentCategory;
  title: string;
  icon: string;
  evolutionSource: DnaEvolutionSource;
  visualizationKind: DnaVisualizationKind;
  isComputed: boolean;
  slices: DnaSliceViewModel[];
  ariaLabel: string;
}

export interface DnaInterpretationViewModel {
  id: string;
  headline: string;
  detail: string;
}

export interface MusicalDnaViewModel {
  evolutionPercent: number;
  computedCategoryCount: number;
  totalCategoryCount: number;
  subtitle: string;
  guineaAccent: string | null;
  categories: DnaCategoryViewModel[];
  interpretation: DnaInterpretationViewModel;
}
