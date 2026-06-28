import type { StorySectionViewModel } from "../lib/profileStory";
import { ProfileStoryCard } from "./ProfileStoryCard";

interface ProfileStoryGroupReadProps {
  groupLabel: string;
  sections: StorySectionViewModel[];
  mode: "read";
}

interface ProfileStoryGroupEditProps {
  groupLabel: string;
  sections: StorySectionViewModel[];
  mode: "edit";
  draftValues: Record<string, string>;
  onDraftChange: (sectionId: string, value: string) => void;
}

type ProfileStoryGroupProps = ProfileStoryGroupReadProps | ProfileStoryGroupEditProps;

export function ProfileStoryGroup(props: ProfileStoryGroupProps) {
  const { groupLabel, sections, mode } = props;

  if (mode === "read" && sections.every((section) => !section.isFilled)) {
    return null;
  }

  const groupId = groupLabel.replace(/\s+/g, "-").toLowerCase();

  return (
    <section className="identity-story-group" aria-labelledby={`story-group-${groupId}`}>
      <h3 id={`story-group-${groupId}`} className="identity-story-group__title">
        {groupLabel}
      </h3>
      <div className="identity-story-group__grid" role="list">
        {sections.map((section) => {
          if (mode === "read" && !section.isFilled) return null;
          return (
            <div key={section.id} role="listitem" className="identity-story-group__cell">
              {mode === "read" ? (
                <ProfileStoryCard section={section} mode="read" />
              ) : (
                <ProfileStoryCard
                  section={section}
                  mode="edit"
                  value={props.draftValues[section.id] ?? section.profileContent}
                  onChange={(value) => props.onDraftChange(section.id, value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
