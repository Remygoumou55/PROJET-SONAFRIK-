import Link from "next/link";
import { buttonVariants } from "@sonafrik/ui";
import type { MusicalIdentityViewModel } from "../lib/profileMusicalIdentity";
import { ProfileMusicalIdentityGroup } from "./ProfileMusicalIdentityGroup";

interface ProfileMusicalIdentitySummaryProps {
  identity: MusicalIdentityViewModel;
}

export function ProfileMusicalIdentitySummary({
  identity,
}: ProfileMusicalIdentitySummaryProps) {
  return (
    <div className="identity-musical-summary" aria-labelledby="musical-identity-summary-title">
      <div className="identity-musical-summary__header">
        <div className="identity-musical-summary__percent-wrap">
          <span className="identity-musical-summary__percent" aria-hidden="true">
            {identity.completenessPercent}%
          </span>
          <p id="musical-identity-summary-title" className="identity-musical-summary__label">
            Passeport complété
          </p>
        </div>
        <p className="identity-musical-summary__stats">
          <strong>{identity.filledCount}</strong> sur{" "}
          <strong>{identity.totalCount}</strong> dimensions renseignées
        </p>
      </div>

      <div
        className="identity-musical-summary__track"
        role="progressbar"
        aria-valuenow={identity.completenessPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Identité musicale complétée à ${identity.completenessPercent} pour cent`}
      >
        <div
          className="identity-musical-summary__fill"
          style={{ width: `${identity.completenessPercent}%` }}
        />
      </div>

      {identity.guineaHighlight ? (
        <p className="identity-musical-summary__guinea">{identity.guineaHighlight}</p>
      ) : null}
    </div>
  );
}

interface ProfileMusicalIdentitySectionProps {
  identity: MusicalIdentityViewModel;
}

export function ProfileMusicalIdentitySection({
  identity,
}: ProfileMusicalIdentitySectionProps) {
  const showEditCta = identity.completenessPercent < 100;

  return (
    <section className="identity-musical" aria-labelledby="profile-musical-identity-title">
      <header className="identity-musical__header">
        <h2 id="profile-musical-identity-title" className="identity-musical__title">
          Mon identité musicale
        </h2>
        <p className="identity-musical__tagline">{identity.tagline}</p>
        <p className="identity-musical__subtitle">{identity.subtitle}</p>
      </header>

      <ProfileMusicalIdentitySummary identity={identity} />

      <div className="identity-musical__groups">
        {identity.groups.map((group) => (
          <ProfileMusicalIdentityGroup key={group.id} group={group} />
        ))}
      </div>

      {showEditCta ? (
        <div className="identity-musical__actions">
          <Link
            href="/profile/edit"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Enrichir mon identité
          </Link>
        </div>
      ) : null}
    </section>
  );
}
