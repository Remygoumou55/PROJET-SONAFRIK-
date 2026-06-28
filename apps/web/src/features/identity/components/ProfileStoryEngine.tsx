"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../lib/profilePresentation";
import {
  buildStoryEngine,
  getStoryGroupLabel,
  type StoryDraftStorage,
  type StoryEngineViewModel,
} from "../lib/profileStory";
import { loadStoryDrafts, saveStoryDrafts } from "../lib/profileStory/storage";
import { ProfileStoryGroup } from "./ProfileStoryGroup";

interface ProfileStoryEngineProps {
  userId: string;
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

function buildInitialDrafts(story: StoryEngineViewModel, stored: StoryDraftStorage): StoryDraftStorage {
  const merged: StoryDraftStorage = { ...stored };
  for (const section of story.allSections) {
    if (merged[section.id] === undefined && section.profileContent) {
      merged[section.id] = section.profileContent;
    }
  }
  return merged;
}

export function ProfileStoryEngine({
  userId,
  profile,
  activity,
  isArtist,
}: ProfileStoryEngineProps) {
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [drafts, setDrafts] = useState<StoryDraftStorage>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStoryDrafts(userId);
    setDrafts(stored);
    setHydrated(true);
  }, [userId]);

  const handleEnterEdit = useCallback(() => {
    const stored = loadStoryDrafts(userId);
    const baseStory = buildStoryEngine(profile, activity, isArtist, stored);
    setDrafts(buildInitialDrafts(baseStory, stored));
    setMode("edit");
  }, [profile, activity, isArtist, userId]);

  const story = useMemo(
    () => buildStoryEngine(profile, activity, isArtist, hydrated ? drafts : {}),
    [profile, activity, isArtist, drafts, hydrated],
  );

  const handleDraftChange = useCallback((sectionId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [sectionId]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const trimmed: StoryDraftStorage = {};
    for (const section of story.allSections) {
      const value = drafts[section.id]?.trim();
      if (value) trimmed[section.id] = value;
    }
    saveStoryDrafts(userId, trimmed);
    setDrafts(trimmed);
    setMode("read");
  }, [drafts, story.allSections, userId]);

  const handleCancel = useCallback(() => {
    setDrafts(loadStoryDrafts(userId));
    setMode("read");
  }, [userId]);

  const showEmptyReadState = mode === "read" && story.visibleSections.length === 0;

  return (
    <section id="profile-story" className="identity-story" aria-labelledby="profile-story-title">
      <header className="identity-story__header">
        <div className="identity-story__intro">
          <h2 id="profile-story-title" className="identity-story__title">
            Mon histoire musicale
          </h2>
          <p className="identity-story__tagline">{story.tagline}</p>
          <p className="identity-story__subtitle">{story.subtitle}</p>
        </div>
        <div className="identity-story__actions">
          {mode === "read" ? (
            <button
              type="button"
              className="identity-story__mode-btn"
              onClick={handleEnterEdit}
            >
              Écrire mon histoire
            </button>
          ) : (
            <>
              <button
                type="button"
                className="identity-story__mode-btn identity-story__mode-btn--ghost"
                onClick={handleCancel}
              >
                Annuler
              </button>
              <button
                type="button"
                className="identity-story__mode-btn identity-story__mode-btn--primary"
                onClick={handleSave}
              >
                Enregistrer
              </button>
            </>
          )}
        </div>
      </header>

      <div className="identity-story__meta" aria-live="polite">
        <span className="identity-story__progress">
          <strong>{story.filledCount}</strong> / {story.totalCount} chapitres rédigés
        </span>
      </div>

      {showEmptyReadState ? (
        <div className="identity-story__empty">
          <p className="identity-story__empty-text">
            Votre carnet est encore vierge — commencez par raconter votre histoire.
          </p>
          <button
            type="button"
            className="identity-story__mode-btn identity-story__mode-btn--primary"
            onClick={handleEnterEdit}
          >
            Commencer à écrire
          </button>
        </div>
      ) : (
        <div className="identity-story__groups">
          {mode === "read" ? (
            <>
              <ProfileStoryGroup
                groupLabel={getStoryGroupLabel("narrative")}
                sections={story.narrativeSections}
                mode="read"
              />
              <ProfileStoryGroup
                groupLabel={getStoryGroupLabel("roots")}
                sections={story.rootsSections}
                mode="read"
              />
            </>
          ) : (
            <>
              <ProfileStoryGroup
                groupLabel={getStoryGroupLabel("narrative")}
                sections={story.narrativeSections}
                mode="edit"
                draftValues={drafts}
                onDraftChange={handleDraftChange}
              />
              <ProfileStoryGroup
                groupLabel={getStoryGroupLabel("roots")}
                sections={story.rootsSections}
                mode="edit"
                draftValues={drafts}
                onDraftChange={handleDraftChange}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
