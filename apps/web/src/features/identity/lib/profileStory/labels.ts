import type { StorySectionGroup } from "./types";

export const STORY_GROUP_LABELS: Record<StorySectionGroup, string> = {
  narrative: "Mon récit",
  roots: "Racines guinéennes",
};

export function getStoryGroupLabel(group: StorySectionGroup): string {
  return STORY_GROUP_LABELS[group];
}
