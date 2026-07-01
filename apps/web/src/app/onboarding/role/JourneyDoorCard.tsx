"use client";

import { memo, useCallback } from "react";

export type JourneyDoorKind = "artist" | "listener";

export type JourneyDoorCardProps = {
  kind: JourneyDoorKind;
  heading: string;
  subtitle: string;
  benefits: readonly string[];
  ctaLabel: string;
  selected: boolean;
  loading: boolean;
  dimmed: boolean;
  onSelect: () => void;
  onContinue: () => void;
};

function ArtistDoorBackground() {
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="artist-glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="var(--color-or-solaire)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-noir-profond)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="320" fill="url(#artist-glow)" />
      <path
        d="M0 200 Q50 180 100 200 T200 200 T300 200 T400 200 V320 H0 Z"
        fill="var(--color-or-solaire)"
        fillOpacity="0.06"
      />
      <path
        d="M0 230 Q80 210 160 230 T320 230 T400 230 V320 H0 Z"
        fill="var(--color-or-solaire)"
        fillOpacity="0.04"
      />
      <ellipse cx="200" cy="90" rx="28" ry="48" fill="none" stroke="var(--color-or-solaire)" strokeOpacity="0.12" strokeWidth="2" />
      <line x1="200" y1="138" x2="200" y2="175" stroke="var(--color-or-solaire)" strokeOpacity="0.1" strokeWidth="2" />
      <path d="M175 175 H225" stroke="var(--color-or-solaire)" strokeOpacity="0.1" strokeWidth="2" />
    </svg>
  );
}

function ListenerDoorBackground() {
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="listener-glow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="var(--color-vert-energie)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-noir-profond)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="320" fill="url(#listener-glow)" />
      <circle cx="200" cy="160" r="72" fill="none" stroke="var(--color-vert-energie)" strokeOpacity="0.1" strokeWidth="2" />
      <circle cx="200" cy="160" r="28" fill="var(--color-vert-energie)" fillOpacity="0.05" />
      <path
        d="M120 120 Q200 80 280 120"
        fill="none"
        stroke="var(--color-vert-energie)"
        strokeOpacity="0.08"
        strokeWidth="2"
      />
      <path
        d="M0 250 Q100 230 200 250 T400 250 V320 H0 Z"
        fill="var(--color-vert-energie)"
        fillOpacity="0.05"
      />
    </svg>
  );
}

const DOOR_ICONS: Record<JourneyDoorKind, string> = {
  artist: "🎤",
  listener: "🎧",
};

export const JourneyDoorCard = memo(function JourneyDoorCard({
  kind,
  heading,
  subtitle,
  benefits,
  ctaLabel,
  selected,
  loading,
  dimmed,
  onSelect,
  onContinue,
}: JourneyDoorCardProps) {
  const handleSelectKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    },
    [onSelect],
  );

  return (
    <article
      className={[
        "journey-door",
        `journey-door--${kind}`,
        selected ? "journey-door--selected" : "",
        dimmed ? "journey-door--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`journey-door-title-${kind}`}
    >
      <div className="journey-door__bg">
        {kind === "artist" ? <ArtistDoorBackground /> : <ListenerDoorBackground />}
      </div>

      <span className="journey-door__check" aria-hidden="true">
        ✓
      </span>

      <div className="journey-door__body">
        <button
          type="button"
          className="journey-door__select"
          onClick={onSelect}
          onKeyDown={handleSelectKey}
          aria-pressed={selected}
          aria-describedby={`journey-door-desc-${kind}`}
          disabled={dimmed}
        >
          <span className="journey-door__icon" aria-hidden="true">
            {DOOR_ICONS[kind]}
          </span>
          <h2 className="journey-door__heading" id={`journey-door-title-${kind}`}>
            {heading}
          </h2>
          <p className="journey-door__subtitle" id={`journey-door-desc-${kind}`}>
            {subtitle}
          </p>
          <ul className="journey-door__benefits">
            {benefits.map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </button>

        <button
          type="button"
          className="journey-door__cta"
          onClick={onContinue}
          disabled={!selected || loading || dimmed}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="journey-door__cta-spinner" aria-hidden="true" />
              Chargement…
            </>
          ) : (
            ctaLabel
          )}
        </button>
      </div>
    </article>
  );
});
