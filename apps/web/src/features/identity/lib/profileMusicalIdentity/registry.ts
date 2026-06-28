import {
  getCountryLabel,
  getSongLanguageLabel,
} from "../profilePresentation";
import {
  GUINEAN_NATIONAL_LANGUAGE_CODES,
  SONAFRIK_ROOT_COUNTRY_CODES,
} from "./labels";
import type {
  MusicalIdentityDimensionDefinition,
  MusicalIdentityValue,
} from "./types";

function textValue(id: string, label: string, variant?: MusicalIdentityValue["variant"]): MusicalIdentityValue[] {
  if (!label.trim()) return [];
  return [{ id, label: label.trim(), variant }];
}

function isGuineanLanguage(code: string | null): boolean {
  return !!code && GUINEAN_NATIONAL_LANGUAGE_CODES.has(code.toLowerCase());
}

/**
 * Registre des dimensions d'identité musicale.
 * Ajouter une dimension ici — aucun changement UI requis.
 */
export const MUSICAL_IDENTITY_DIMENSIONS: MusicalIdentityDimensionDefinition[] = [
  {
    id: "primary_genre",
    label: "Genre musical principal",
    icon: "🎵",
    group: "sound",
    audience: "artist",
    order: 10,
    evolutionSource: "published_tracks",
    emptyHint: "Votre genre principal définit votre signature sur la scène.",
    resolve: (ctx) => textValue("primary_genre", ctx.profile.main_genre ?? "", "accent"),
  },
  {
    id: "secondary_genres",
    label: "Genres secondaires",
    icon: "🎶",
    group: "sound",
    audience: "artist",
    order: 20,
    evolutionSource: "listened_genres",
    emptyHint: "Vos écoutes révéleront bientôt vos influences croisées.",
    resolve: () => [],
  },
  {
    id: "languages",
    label: "Langues musicales",
    icon: "🗣️",
    group: "sound",
    audience: "all",
    order: 30,
    evolutionSource: "profile_static",
    emptyHint: "Exprimez-vous dans la langue de votre cœur — Soussou, Pular, Malinké…",
    resolve: (ctx) => {
      const label = getSongLanguageLabel(ctx.profile.song_language);
      if (!label) return [];
      const variant = isGuineanLanguage(ctx.profile.song_language) ? "guinea" : "default";
      return [{ id: "lang_primary", label, variant }];
    },
  },
  {
    id: "city",
    label: "Ville",
    icon: "📍",
    group: "roots",
    audience: "all",
    order: 40,
    evolutionSource: "profile_static",
    emptyHint: "Votre ville ancre votre musique dans un territoire vivant.",
    resolve: (ctx) => textValue("city", ctx.profile.city ?? ""),
  },
  {
    id: "region",
    label: "Région",
    icon: "🗺️",
    group: "roots",
    audience: "all",
    order: 50,
    evolutionSource: "profile_static",
    emptyHint: "Votre région porte des sonorités uniques — partagez-la.",
    resolve: (ctx) => {
      const region = ctx.profile.origin_region?.trim() ?? "";
      if (!region) return [];
      return [{ id: "region", label: region, variant: "guinea" }];
    },
  },
  {
    id: "country",
    label: "Pays",
    icon: "🇬🇳",
    group: "roots",
    audience: "all",
    order: 60,
    evolutionSource: "profile_static",
    emptyHint: "SONAFRIK célèbre d'abord la Guinée, puis l'Afrique entière.",
    resolve: (ctx) => {
      const label = getCountryLabel(ctx.profile.country_code);
      if (!label) return [];
      const code = ctx.profile.country_code?.toUpperCase() ?? "";
      const variant = SONAFRIK_ROOT_COUNTRY_CODES.has(code) ? "guinea" : "default";
      return [{ id: "country", label, variant }];
    },
  },
  {
    id: "instruments",
    label: "Instruments pratiqués",
    icon: "🪘",
    group: "craft",
    audience: "artist",
    order: 70,
    evolutionSource: "profile_static",
    emptyHint: "Djembé, kora, guitare… vos instruments racontent votre histoire.",
    resolve: () => [],
  },
  {
    id: "influences",
    label: "Influences musicales",
    icon: "💫",
    group: "craft",
    audience: "artist",
    order: 80,
    evolutionSource: "listened_genres",
    emptyHint: "Vos influences se révéleront au fil de vos écoutes et créations.",
    resolve: () => [],
  },
  {
    id: "favorite_artists",
    label: "Artistes favoris",
    icon: "⭐",
    group: "community",
    audience: "all",
    order: 90,
    evolutionSource: "followed_artists",
    emptyHint: "Les artistes que vous suivez enrichiront votre passeport musical.",
    resolve: () => [],
  },
  {
    id: "musical_mood",
    label: "Ambiance musicale",
    icon: "🌙",
    group: "sound",
    audience: "all",
    order: 100,
    evolutionSource: "playlists",
    emptyHint: "Énergique, introspectif, festif… votre ambiance prendra forme avec vos playlists.",
    resolve: () => [],
  },
  {
    id: "musical_goal",
    label: "Objectif musical",
    icon: "🎯",
    group: "vision",
    audience: "artist",
    order: 110,
    evolutionSource: "interactions",
    emptyHint: "Quel rêve musical guide votre parcours ? Partagez-le bientôt.",
    resolve: () => [],
  },
];
