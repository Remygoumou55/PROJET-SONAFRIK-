import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../profilePresentation";
import { getStoryGroupLabel } from "./labels";
import { STORY_SECTION_DEFINITIONS } from "./registry";
import type {
  StoryContext,
  StoryDraftStorage,
  StoryEngineViewModel,
  StorySectionDefinition,
  StorySectionViewModel,
} from "./types";

function filterSectionsForAudience(
  sections: StorySectionDefinition[],
  isArtist: boolean,
): StorySectionDefinition[] {
  return sections.filter((section) => {
    if (section.audience === "all") return true;
    if (section.audience === "artist") return isArtist;
    return !isArtist;
  });
}

function resolveSectionContent(
  section: StorySectionDefinition,
  ctx: StoryContext,
  drafts: StoryDraftStorage,
): string {
  const draft = drafts[section.id]?.trim();
  if (draft) return draft;
  return section.resolveFromProfile(ctx)?.trim() ?? "";
}

function buildSectionViewModel(
  section: StorySectionDefinition,
  ctx: StoryContext,
  drafts: StoryDraftStorage,
): StorySectionViewModel {
  const content = resolveSectionContent(section, ctx, drafts);
  const profileContent = section.resolveFromProfile(ctx)?.trim() ?? "";
  const isFilled = content.length > 0;

  return {
    id: section.id,
    title: section.title,
    icon: section.icon,
    group: section.group,
    groupLabel: getStoryGroupLabel(section.group),
    content,
    profileContent,
    isFilled,
    emptyHint: section.emptyHint,
    editPlaceholder: section.editPlaceholder,
    evolutionSource: section.evolutionSource,
    ariaLabel: `${section.title}${isFilled ? " — renseigné" : " — à compléter"}`,
  };
}

function getTagline(filledCount: number, totalCount: number): string {
  if (filledCount >= totalCount && totalCount > 0) {
    return "Votre carnet de parcours est complet — votre voix résonne.";
  }
  if (filledCount >= 3) {
    return "Votre parcours mérite d'être raconté — continuez à écrire votre légende.";
  }
  if (filledCount >= 1) {
    return "Chaque artiste possède une histoire unique — la vôtre prend forme.";
  }
  return "La musique commence toujours par une histoire.";
}

function getSubtitle(filledCount: number): string {
  if (filledCount === 0) {
    return "Prenez un moment pour raconter ce qui vous rend unique sur SONAFRIK.";
  }
  return "Votre histoire inspirera peut-être d'autres créateurs.";
}

export function buildStoryEngine(
  profile: Profile,
  activity: ProfileActivitySummary,
  isArtist: boolean,
  drafts: StoryDraftStorage = {},
): StoryEngineViewModel {
  const ctx: StoryContext = { profile, activity, isArtist };
  const applicable = filterSectionsForAudience(
    [...STORY_SECTION_DEFINITIONS].sort((a, b) => a.order - b.order),
    isArtist,
  );

  const allSections = applicable.map((section) =>
    buildSectionViewModel(section, ctx, drafts),
  );
  const visibleSections = allSections.filter((section) => section.isFilled);
  const narrativeSections = allSections.filter((section) => section.group === "narrative");
  const rootsSections = allSections.filter((section) => section.group === "roots");
  const filledCount = allSections.filter((section) => section.isFilled).length;

  return {
    filledCount,
    totalCount: allSections.length,
    tagline: getTagline(filledCount, allSections.length),
    subtitle: getSubtitle(filledCount),
    narrativeSections,
    rootsSections,
    visibleSections,
    allSections,
  };
}
