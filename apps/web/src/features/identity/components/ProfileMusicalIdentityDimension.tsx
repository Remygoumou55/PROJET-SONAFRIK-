import { memo } from "react";
import type { MusicalIdentityDimensionViewModel } from "../lib/profileMusicalIdentity";
import { ProfileMusicalIdentityPill } from "./ProfileMusicalIdentityPill";

interface ProfileMusicalIdentityDimensionProps {
  dimension: MusicalIdentityDimensionViewModel;
}

export const ProfileMusicalIdentityDimension = memo(
  function ProfileMusicalIdentityDimension({
    dimension,
  }: ProfileMusicalIdentityDimensionProps) {
    return (
      <div
        className={`identity-musical-dimension${dimension.isFilled ? " identity-musical-dimension--filled" : ""}`}
        aria-label={dimension.ariaLabel}
        data-evolution-source={dimension.evolutionSource}
      >
        <div className="identity-musical-dimension__header">
          <span className="identity-musical-dimension__icon" aria-hidden="true">
            {dimension.icon}
          </span>
          <p className="identity-musical-dimension__label">{dimension.label}</p>
        </div>
        <div className="identity-musical-dimension__pills" role="list">
          {dimension.pills.map((pill) => (
            <span key={pill.id} role="listitem">
              <ProfileMusicalIdentityPill pill={pill} />
            </span>
          ))}
        </div>
      </div>
    );
  },
);
