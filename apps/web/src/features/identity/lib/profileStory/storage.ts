import type { StoryDraftStorage } from "./types";
import { getStoryStorageKey } from "./types";

export function loadStoryDrafts(userId: string): StoryDraftStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStoryStorageKey(userId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const result: StoryDraftStorage = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export function saveStoryDrafts(userId: string, drafts: StoryDraftStorage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStoryStorageKey(userId), JSON.stringify(drafts));
  } catch {
    /* quota ou mode privé — silencieux */
  }
}
