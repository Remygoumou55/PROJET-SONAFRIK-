import {
  getCountryLabel,
  getSongLanguageLabel,
} from "../profilePresentation";
import {
  GUINEAN_NATIONAL_LANGUAGE_CODES,
  GUINEAN_REGION_KEYWORDS,
  SONAFRIK_ROOT_COUNTRY_CODES,
} from "./labels";
import type { DnaCategoryDefinition, DnaSliceDefinition } from "./types";

function normalizeWeights(slices: DnaSliceDefinition[]): DnaSliceDefinition[] {
  if (slices.length === 0) return slices;
  const total = slices.reduce((sum, slice) => sum + slice.weight, 0);
  if (total <= 0) return slices;
  return slices.map((slice) => ({
    ...slice,
    weight: Math.round((slice.weight / total) * 100),
  }));
}

function isGuineanRegion(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const lower = text.toLowerCase();
  return GUINEAN_REGION_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function inferStyleFromGenre(genre: string | null | undefined): string | null {
  if (!genre?.trim()) return null;
  const lower = genre.toLowerCase();
  if (lower.includes("afro") || lower.includes("afrobeats")) return "Afrobeat";
  if (lower.includes("rap") || lower.includes("hip")) return "Hip-hop";
  if (lower.includes("trad") || lower.includes("folk")) return "Traditionnel";
  if (lower.includes("gospel") || lower.includes("gospel")) return "Gospel";
  if (lower.includes("electro") || lower.includes("house")) return "Électronique";
  return "Fusion locale";
}

function emergingSlice(id: string, label: string): DnaSliceDefinition[] {
  return [{ id, label, weight: 100, variant: "emerging" }];
}

/**
 * Registre central des catégories ADN musical.
 * Ajouter une catégorie ou une source ici — aucun changement UI requis.
 */
export const MUSICAL_DNA_CATEGORIES: DnaCategoryDefinition[] = [
  {
    id: "dna_genres",
    category: "genre",
    title: "Genres",
    icon: "🎵",
    audience: "all",
    order: 10,
    evolutionSource: "listen_history",
    visualizationKind: "bar",
    resolve: (ctx) => {
      const slices: DnaSliceDefinition[] = [];
      if (ctx.profile.main_genre?.trim()) {
        slices.push({
          id: "genre_primary",
          label: ctx.profile.main_genre.trim(),
          weight: ctx.publishedTracks > 0 ? 75 : 85,
          variant: "accent",
        });
      }
      if (ctx.isArtist && ctx.publishedTracks > 0) {
        slices.push({
          id: "genre_catalog",
          label: "Catalogue publié",
          weight: 25,
          variant: "default",
        });
      } else if (ctx.profile.main_genre?.trim()) {
        slices.push({
          id: "genre_explore",
          label: "Exploration",
          weight: 15,
          variant: "emerging",
        });
      }
      if (slices.length === 0) {
        return emergingSlice("genre_pending", "En formation via vos écoutes");
      }
      return normalizeWeights(slices);
    },
  },
  {
    id: "dna_languages",
    category: "language",
    title: "Langues",
    icon: "🗣️",
    audience: "all",
    order: 20,
    evolutionSource: "listen_history",
    visualizationKind: "stack",
    resolve: (ctx) => {
      const label = getSongLanguageLabel(ctx.profile.song_language);
      if (!label) {
        return emergingSlice("lang_pending", "Langues en découverte");
      }
      const isGuinea = GUINEAN_NATIONAL_LANGUAGE_CODES.has(
        ctx.profile.song_language?.toLowerCase() ?? "",
      );
      return normalizeWeights([
        {
          id: "lang_primary",
          label,
          weight: 85,
          variant: isGuinea ? "guinea" : "default",
        },
        {
          id: "lang_mixed",
          label: "Mix francophone",
          weight: 15,
          variant: "default",
        },
      ]);
    },
  },
  {
    id: "dna_regions",
    category: "region",
    title: "Régions",
    icon: "🗺️",
    audience: "all",
    order: 30,
    evolutionSource: "profile_static",
    visualizationKind: "bar",
    resolve: (ctx) => {
      const slices: DnaSliceDefinition[] = [];
      const country = getCountryLabel(ctx.profile.country_code);
      const region = ctx.profile.origin_region?.trim();

      if (region) {
        slices.push({
          id: "region_origin",
          label: region,
          weight: 60,
          variant: isGuineanRegion(region) ? "guinea" : "default",
        });
      }
      if (country) {
        slices.push({
          id: "region_country",
          label: country,
          weight: region ? 40 : 100,
          variant: SONAFRIK_ROOT_COUNTRY_CODES.has(ctx.profile.country_code?.toUpperCase() ?? "")
            ? "guinea"
            : "default",
        });
      }
      if (slices.length === 0) {
        return emergingSlice("region_pending", "Territoires à explorer");
      }
      return normalizeWeights(slices);
    },
  },
  {
    id: "dna_styles",
    category: "style",
    title: "Styles",
    icon: "🎸",
    audience: "all",
    order: 40,
    evolutionSource: "published_catalog",
    visualizationKind: "ring",
    resolve: (ctx) => {
      const style = inferStyleFromGenre(ctx.profile.main_genre);
      if (!style) {
        return emergingSlice("style_pending", "Styles en construction");
      }
      const slices: DnaSliceDefinition[] = [
        { id: "style_primary", label: style, weight: 70, variant: "accent" },
      ];
      if (ctx.isArtist && ctx.publishedTracks >= 3) {
        slices.push({
          id: "style_live",
          label: "Scène live",
          weight: 30,
          variant: "default",
        });
      } else {
        slices.push({
          id: "style_local",
          label: "Son local",
          weight: 30,
          variant: "guinea",
        });
      }
      return normalizeWeights(slices);
    },
  },
  {
    id: "dna_influences",
    category: "influence",
    title: "Influences",
    icon: "✨",
    audience: "all",
    order: 50,
    evolutionSource: "interactions",
    visualizationKind: "radial",
    resolve: (ctx) => {
      const slices: DnaSliceDefinition[] = [];
      const isGuinea = SONAFRIK_ROOT_COUNTRY_CODES.has(
        ctx.profile.country_code?.toUpperCase() ?? "",
      );

      if (isGuinea || isGuineanRegion(ctx.profile.origin_region)) {
        slices.push({
          id: "inf_guinea",
          label: "Culture guinéenne",
          weight: 45,
          variant: "guinea",
        });
      }
      if (ctx.profile.city?.trim()) {
        slices.push({
          id: "inf_city",
          label: `Scène ${ctx.profile.city.trim()}`,
          weight: 25,
          variant: "default",
        });
      }
      if (ctx.isArtist && ctx.publishedTracks > 0) {
        slices.push({
          id: "inf_creation",
          label: "Création originale",
          weight: 30,
          variant: "accent",
        });
      } else {
        slices.push({
          id: "inf_discovery",
          label: "Découverte locale",
          weight: 30,
          variant: "emerging",
        });
      }
      if (slices.length === 0) {
        return emergingSlice("inf_pending", "Influences à révéler");
      }
      return normalizeWeights(slices);
    },
  },
];
