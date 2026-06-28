import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";
import {
  GUINEAN_NATIONAL_LANGUAGE_CODES,
  getIdentityGroupMeta,
  SONAFRIK_ROOT_COUNTRY_CODES,
} from "./labels";
import { MUSICAL_IDENTITY_DIMENSIONS } from "./registry";
import type {
  IdentityDimensionGroup,
  MusicalIdentityContext,
  MusicalIdentityDimensionDefinition,
  MusicalIdentityDimensionViewModel,
  MusicalIdentityGroupViewModel,
  MusicalIdentityPillViewModel,
  MusicalIdentityViewModel,
} from "./types";

function filterDimensionsForAudience(
  dimensions: MusicalIdentityDimensionDefinition[],
  isArtist: boolean,
): MusicalIdentityDimensionDefinition[] {
  return dimensions.filter((dim) => {
    if (dim.audience === "all") return true;
    if (dim.audience === "artist") return isArtist;
    return !isArtist;
  });
}

function buildPills(
  values: ReturnType<MusicalIdentityDimensionDefinition["resolve"]>,
  isFilled: boolean,
  emptyHint: string,
): MusicalIdentityPillViewModel[] {
  if (isFilled) {
    return values.map((v) => ({
      id: v.id,
      label: v.label,
      variant: v.variant ?? "default",
    }));
  }
  return [{ id: "placeholder", label: emptyHint, variant: "placeholder" }];
}

function buildDimensionViewModel(
  dim: MusicalIdentityDimensionDefinition,
  ctx: MusicalIdentityContext,
): MusicalIdentityDimensionViewModel {
  const values = dim.resolve(ctx);
  const isFilled = values.length > 0;
  const pills = buildPills(values, isFilled, dim.emptyHint);
  const statusLabel = isFilled ? "Renseigné" : "À enrichir";

  return {
    id: dim.id,
    label: dim.label,
    icon: dim.icon,
    evolutionSource: dim.evolutionSource,
    isFilled,
    emptyHint: dim.emptyHint,
    pills,
    ariaLabel: `${dim.label} — ${statusLabel}`,
  };
}

function resolveGuineaHighlight(ctx: MusicalIdentityContext): string | null {
  const code = ctx.profile.country_code?.toUpperCase() ?? "";
  const hasGuineanLang = GUINEAN_NATIONAL_LANGUAGE_CODES.has(
    ctx.profile.song_language?.toLowerCase() ?? "",
  );
  const isGuinea = SONAFRIK_ROOT_COUNTRY_CODES.has(code);

  if (isGuinea && hasGuineanLang) {
    return "Votre culture guinéenne est une force — elle traverse chaque note.";
  }
  if (isGuinea) {
    return "Racines guinéennes — le cœur vibrant de votre identité SONAFRIK.";
  }
  if (hasGuineanLang) {
    return "Une langue nationale porte votre voix — la richesse guinéenne vit en vous.";
  }
  return null;
}

function getTagline(percent: number, isArtist: boolean): string {
  if (percent >= 80) {
    return "Votre univers musical vous distingue.";
  }
  if (percent >= 40) {
    return "Votre identité musicale évolue avec votre parcours.";
  }
  return isArtist
    ? "Chaque artiste possède une histoire unique — la vôtre s'écrit ici."
    : "Votre passeport musical guinéen commence à prendre forme.";
}

function getSubtitle(percent: number): string {
  if (percent >= 100) {
    return "Passeport musical complet — prêt pour la scène SONAFRIK.";
  }
  if (percent >= 50) {
    return "Continuez à enrichir votre profil — chaque détail compte.";
  }
  return "Votre identité musicale évolue avec votre parcours sur SONAFRIK.";
}

function groupDimensions(
  dimensions: MusicalIdentityDimensionViewModel[],
): MusicalIdentityGroupViewModel[] {
  const groupOrder: IdentityDimensionGroup[] = [
    "roots",
    "sound",
    "craft",
    "community",
    "vision",
  ];

  return groupOrder
    .map((groupId) => {
      const meta = getIdentityGroupMeta(groupId);
      const groupDims = dimensions.filter((d) => {
        const def = MUSICAL_IDENTITY_DIMENSIONS.find((x) => x.id === d.id);
        return def?.group === groupId;
      });
      if (groupDims.length === 0) return null;
      return {
        id: groupId,
        title: meta.title,
        icon: meta.icon,
        dimensions: groupDims,
      };
    })
    .filter((g): g is MusicalIdentityGroupViewModel => g !== null);
}

export function buildMusicalIdentity(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
): MusicalIdentityViewModel {
  const ctx: MusicalIdentityContext = { profile, activity, isArtist };
  const applicable = filterDimensionsForAudience(
    [...MUSICAL_IDENTITY_DIMENSIONS].sort((a, b) => a.order - b.order),
    isArtist,
  );

  const dimensions = applicable.map((dim) => buildDimensionViewModel(dim, ctx));
  const filledCount = dimensions.filter((d) => d.isFilled).length;
  const totalCount = dimensions.length;
  const completenessPercent =
    totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return {
    completenessPercent,
    filledCount,
    totalCount,
    tagline: getTagline(completenessPercent, isArtist),
    subtitle: getSubtitle(completenessPercent),
    guineaHighlight: resolveGuineaHighlight(ctx),
    groups: groupDimensions(dimensions),
  };
}
