import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../lib/profilePresentation";
import { buildMusicalDna } from "../lib/profileMusicalDna";
import { ProfileMusicalDnaInterpretation } from "./ProfileMusicalDnaInterpretation";
import { ProfileMusicalDnaSpectrum } from "./ProfileMusicalDnaSpectrum";

interface ProfileMusicalDnaSectionProps {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export function ProfileMusicalDnaSection({
  profile,
  activity,
  isArtist,
}: ProfileMusicalDnaSectionProps) {
  const dna = buildMusicalDna(profile, activity, isArtist);

  return (
    <section className="identity-dna" aria-labelledby="profile-musical-dna-title">
      <header className="identity-dna__header">
        <h2 id="profile-musical-dna-title" className="identity-dna__title">
          Mon ADN Musical
        </h2>
        <p className="identity-dna__subtitle">{dna.subtitle}</p>
      </header>

      <div className="identity-dna__evolution" aria-labelledby="profile-dna-evolution-label">
        <div className="identity-dna__evolution-meta">
          <span className="identity-dna__evolution-percent" aria-hidden="true">
            {dna.evolutionPercent}%
          </span>
          <p id="profile-dna-evolution-label" className="identity-dna__evolution-label">
            ADN calculé
          </p>
        </div>
        <p className="identity-dna__evolution-stats">
          <strong>{dna.computedCategoryCount}</strong> sur{" "}
          <strong>{dna.totalCategoryCount}</strong> dimensions actives
        </p>
        <div
          className="identity-dna__evolution-track"
          role="progressbar"
          aria-valuenow={dna.evolutionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`ADN musical calculé à ${dna.evolutionPercent} pour cent`}
        >
          <div
            className="identity-dna__evolution-fill"
            style={{ width: `${dna.evolutionPercent}%` }}
          />
        </div>
      </div>

      <ProfileMusicalDnaInterpretation
        interpretation={dna.interpretation}
        guineaAccent={dna.guineaAccent}
      />

      <div className="identity-dna__grid">
        {dna.categories.map((category) => (
          <ProfileMusicalDnaSpectrum key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
