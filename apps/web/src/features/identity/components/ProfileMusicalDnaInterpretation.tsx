"use client";

import { memo } from "react";
import type { DnaInterpretationViewModel } from "../lib/profileMusicalDna";

interface ProfileMusicalDnaInterpretationProps {
  interpretation: DnaInterpretationViewModel;
  guineaAccent: string | null;
}

export const ProfileMusicalDnaInterpretation = memo(function ProfileMusicalDnaInterpretation({
  interpretation,
  guineaAccent,
}: ProfileMusicalDnaInterpretationProps) {
  return (
    <aside className="identity-dna-interpretation" aria-labelledby="profile-dna-interpretation-title">
      <p id="profile-dna-interpretation-title" className="identity-dna-interpretation__headline">
        {interpretation.headline}
      </p>
      <p className="identity-dna-interpretation__detail">{interpretation.detail}</p>
      {guineaAccent ? (
        <p className="identity-dna-interpretation__guinea">{guineaAccent}</p>
      ) : null}
    </aside>
  );
});
