"use client";

import { useMemo } from "react";
import {
  TRACK_CREDIT_ROLE_LABELS,
  type TrackCredit,
  type TrackCreditRole,
} from "@sonafrik/types";
import { useTrackCredits } from "../hooks/useTrackCredits";

const ROLE_ORDER: TrackCreditRole[] = [
  "artiste_principal",
  "featuring",
  "auteur",
  "compositeur",
  "producteur",
  "beatmaker",
  "mixage",
  "mastering",
];

function groupCredits(credits: TrackCredit[]) {
  const grouped = new Map<TrackCreditRole, TrackCredit[]>();
  for (const credit of credits) {
    const bucket = grouped.get(credit.role) ?? [];
    bucket.push(credit);
    grouped.set(credit.role, bucket);
  }
  return ROLE_ORDER.filter((role) => grouped.has(role)).map((role) => ({
    role,
    label: TRACK_CREDIT_ROLE_LABELS[role],
    people: grouped.get(role) ?? [],
  }));
}

export function FullPlayerCreditsTab({ trackId }: { trackId: string }) {
  const { credits, loading } = useTrackCredits(trackId);
  const groups = useMemo(() => groupCredits(credits), [credits]);

  if (loading) {
    return (
      <div className="fpp-credits-list" aria-busy="true" aria-live="polite">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="fpp-credit-card fpp-credit-card--skeleton" aria-hidden="true">
            <div className="fpp-credit-card__eyebrow" />
            <div className="fpp-credit-card__line" />
            <div className="fpp-credit-card__line fpp-credit-card__line--short" />
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="fpp-empty-state">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M8 16h5M8 8h8" />
        </svg>
        <p>Les crédits de ce morceau n&apos;ont pas encore été renseignés par l&apos;artiste.</p>
      </div>
    );
  }

  return (
    <div className="fpp-credits-list">
      {groups.map((group) => (
        <section key={group.role} className="fpp-credit-card" aria-labelledby={`credit-${group.role}`}>
          <header className="fpp-credit-card__header">
            <p id={`credit-${group.role}`} className="fpp-credit-card__eyebrow">
              {group.label}
            </p>
            <span className="fpp-credit-card__count">
              {group.people.length} {group.people.length > 1 ? "noms" : "nom"}
            </span>
          </header>
          <div className="fpp-credit-card__body">
            {group.people.map((person) => (
              <div key={person.id} className="fpp-credit-person">
                <strong className="fpp-credit-person__name">{person.contributor_name}</strong>
                <span className="fpp-credit-person__role">{group.label}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
