import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";
import { mergeDnaCategories } from "./adapters";
import { resolveDnaInterpretation } from "./interpretations";
import { GUINEAN_NATIONAL_LANGUAGE_CODES, SONAFRIK_ROOT_COUNTRY_CODES } from "./labels";
import { MUSICAL_DNA_CATEGORIES } from "./registry";
import type {
  DnaCategoryDefinition,
  DnaCategoryViewModel,
  DnaSliceViewModel,
  MusicalDnaContext,
  MusicalDnaViewModel,
} from "./types";

function filterCategoriesForAudience(
  categories: DnaCategoryDefinition[],
  isArtist: boolean,
): DnaCategoryDefinition[] {
  return categories.filter((cat) => {
    if (cat.audience === "all") return true;
    if (cat.audience === "artist") return isArtist;
    if (cat.audience === "listener") return !isArtist;
    return false;
  });
}

function buildContext(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): MusicalDnaContext {
  return {
    profile,
    activity,
    isArtist,
    publishedTracks: activity.publishedTracks ?? 0,
    publishedAlbums: activity.publishedAlbums ?? 0,
  };
}

function isCategoryComputed(slices: DnaSliceViewModel[]): boolean {
  if (slices.length === 0) return false;
  if (slices.length === 1 && slices[0]?.variant === "emerging") return false;
  if (slices.every((s) => s.variant === "emerging" || s.variant === "placeholder")) {
    return false;
  }
  return true;
}

function buildSliceViewModels(
  slices: ReturnType<DnaCategoryDefinition["resolve"]>,
): DnaSliceViewModel[] {
  return slices.map((slice) => ({
    id: slice.id,
    label: slice.label,
    weight: slice.weight,
    variant: slice.variant ?? "default",
    ariaLabel: `${slice.label}, ${slice.weight} pour cent`,
  }));
}

function buildCategoryViewModel(
  cat: DnaCategoryDefinition,
  ctx: MusicalDnaContext,
): DnaCategoryViewModel {
  const rawSlices = cat.resolve(ctx);
  const slices = buildSliceViewModels(rawSlices);
  const computed = isCategoryComputed(slices);

  return {
    id: cat.id,
    category: cat.category,
    title: cat.title,
    icon: cat.icon,
    evolutionSource: cat.evolutionSource,
    visualizationKind: cat.visualizationKind,
    isComputed: computed,
    slices,
    ariaLabel: `${cat.title} — ${computed ? "calculé" : "en formation"}`,
  };
}

function resolveGuineaAccent(ctx: MusicalDnaContext): string | null {
  const isGuinea = SONAFRIK_ROOT_COUNTRY_CODES.has(
    ctx.profile.country_code?.toUpperCase() ?? "",
  );
  const hasGuineanLang = GUINEAN_NATIONAL_LANGUAGE_CODES.has(
    ctx.profile.song_language?.toLowerCase() ?? "",
  );

  if (isGuinea && hasGuineanLang) {
    return "Langues nationales et racines guinéennes au cœur de votre ADN.";
  }
  if (isGuinea) {
    return "La Guinée structure votre univers musical — base de l'expansion africaine.";
  }
  if (hasGuineanLang) {
    return "Une langue nationale porte votre voix — richesse culturelle guinéenne.";
  }
  return null;
}

export function buildMusicalDna(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): MusicalDnaViewModel {
  const ctx = buildContext(profile, activity, isArtist);
  const merged = mergeDnaCategories(MUSICAL_DNA_CATEGORIES, ctx);
  const applicable = filterCategoriesForAudience(
    [...merged].sort((a, b) => a.order - b.order),
    isArtist,
  );

  const categories = applicable.map((cat) => buildCategoryViewModel(cat, ctx));
  const computedCategoryCount = categories.filter((c) => c.isComputed).length;
  const totalCategoryCount = categories.length;
  const evolutionPercent =
    totalCategoryCount > 0
      ? Math.round((computedCategoryCount / totalCategoryCount) * 100)
      : 0;

  const partialModel = { evolutionPercent, computedCategoryCount };
  const interpretation = resolveDnaInterpretation(ctx, partialModel);

  return {
    evolutionPercent,
    computedCategoryCount,
    totalCategoryCount,
    subtitle: "Votre identité musicale évolue avec votre activité.",
    guineaAccent: resolveGuineaAccent(ctx),
    categories,
    interpretation,
  };
}
