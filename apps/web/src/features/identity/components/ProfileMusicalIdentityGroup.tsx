import type { MusicalIdentityGroupViewModel } from "../lib/profileMusicalIdentity";
import { ProfileMusicalIdentityDimension } from "./ProfileMusicalIdentityDimension";

interface ProfileMusicalIdentityGroupProps {
  group: MusicalIdentityGroupViewModel;
}

export function ProfileMusicalIdentityGroup({ group }: ProfileMusicalIdentityGroupProps) {
  return (
    <section
      className="identity-musical-group"
      aria-labelledby={`musical-group-${group.id}`}
    >
      <h3 id={`musical-group-${group.id}`} className="identity-musical-group__title">
        <span className="identity-musical-group__icon" aria-hidden="true">
          {group.icon}
        </span>
        {group.title}
      </h3>
      <div className="identity-musical-group__grid">
        {group.dimensions.map((dimension) => (
          <ProfileMusicalIdentityDimension key={dimension.id} dimension={dimension} />
        ))}
      </div>
    </section>
  );
}
