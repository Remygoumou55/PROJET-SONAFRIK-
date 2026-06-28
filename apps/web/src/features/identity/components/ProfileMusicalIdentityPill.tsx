import { memo } from "react";
import type { MusicalIdentityPillViewModel } from "../lib/profileMusicalIdentity";

interface ProfileMusicalIdentityPillProps {
  pill: MusicalIdentityPillViewModel;
}

export const ProfileMusicalIdentityPill = memo(function ProfileMusicalIdentityPill({
  pill,
}: ProfileMusicalIdentityPillProps) {
  return (
    <span
      className={`identity-musical-pill identity-musical-pill--${pill.variant}`}
      aria-label={pill.variant === "placeholder" ? pill.label : undefined}
    >
      {pill.label}
    </span>
  );
});
