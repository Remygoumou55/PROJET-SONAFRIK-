"use client";

import { memo } from "react";
import type { StorySectionViewModel } from "../lib/profileStory";

interface ProfileStoryCardReadProps {
  section: StorySectionViewModel;
  mode: "read";
}

interface ProfileStoryCardEditProps {
  section: StorySectionViewModel;
  mode: "edit";
  value: string;
  onChange: (value: string) => void;
}

type ProfileStoryCardProps = ProfileStoryCardReadProps | ProfileStoryCardEditProps;

export const ProfileStoryCard = memo(function ProfileStoryCard(props: ProfileStoryCardProps) {
  const { section, mode } = props;

  return (
    <article
      className={`identity-story-card${section.isFilled ? " identity-story-card--filled" : ""}${mode === "edit" ? " identity-story-card--editing" : ""}`}
      aria-label={section.ariaLabel}
      data-evolution-source={section.evolutionSource}
    >
      <header className="identity-story-card__header">
        <span className="identity-story-card__icon" aria-hidden="true">
          {section.icon}
        </span>
        <h4 className="identity-story-card__title">{section.title}</h4>
      </header>

      {mode === "read" ? (
        section.isFilled ? (
          <p className="identity-story-card__content">{section.content}</p>
        ) : (
          <p className="identity-story-card__hint">{section.emptyHint}</p>
        )
      ) : (
        <label className="identity-story-card__field">
          <span className="identity-story-card__sr-label">{section.title}</span>
          <textarea
            className="identity-story-card__textarea"
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            placeholder={section.editPlaceholder}
            rows={4}
            aria-label={section.title}
          />
        </label>
      )}
    </article>
  );
});
