import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../lib/profilePresentation";
import { ProfileStoryEngine } from "./ProfileStoryEngine";

interface ProfileStorySectionProps {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export function ProfileStorySection({
  profile,
  activity,
  isArtist,
}: ProfileStorySectionProps) {
  return (
    <ProfileStoryEngine
      userId={profile.id}
      profile={profile}
      activity={activity}
      isArtist={isArtist}
    />
  );
}
