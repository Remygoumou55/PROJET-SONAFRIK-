"use client";

import { memo, type ReactNode } from "react";
import type { DnaCategoryViewModel, DnaSliceViewModel } from "../lib/profileMusicalDna";

interface ProfileMusicalDnaSpectrumProps {
  category: DnaCategoryViewModel;
}

function SliceBarList({ slices }: { slices: DnaSliceViewModel[] }) {
  return (
    <ul className="identity-dna-spectrum__bars" role="list">
      {slices.map((slice) => (
        <li key={slice.id} className="identity-dna-spectrum__bar-row">
          <div className="identity-dna-spectrum__bar-meta">
            <span className="identity-dna-spectrum__bar-label">{slice.label}</span>
            <span className="identity-dna-spectrum__bar-value" aria-hidden="true">
              {slice.weight}%
            </span>
          </div>
          <div
            className="identity-dna-spectrum__bar-track"
            role="meter"
            aria-label={slice.ariaLabel}
            aria-valuenow={slice.weight}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`identity-dna-spectrum__bar-fill identity-dna-spectrum__bar-fill--${slice.variant}`}
              style={{ width: `${slice.weight}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function SliceStack({ slices }: { slices: DnaSliceViewModel[] }) {
  return (
    <div className="identity-dna-spectrum__stack-wrap">
      <div
        className="identity-dna-spectrum__stack"
        role="img"
        aria-label={slices.map((s) => s.ariaLabel).join(", ")}
      >
        {slices.map((slice) => (
          <div
            key={slice.id}
            className={`identity-dna-spectrum__stack-segment identity-dna-spectrum__bar-fill--${slice.variant}`}
            style={{ flexGrow: slice.weight }}
            title={`${slice.label} ${slice.weight}%`}
          />
        ))}
      </div>
      <ul className="identity-dna-spectrum__legend" role="list">
        {slices.map((slice) => (
          <li key={slice.id} className="identity-dna-spectrum__legend-item">
            <span
              className={`identity-dna-spectrum__legend-dot identity-dna-spectrum__bar-fill--${slice.variant}`}
              aria-hidden="true"
            />
            <span className="identity-dna-spectrum__legend-label">{slice.label}</span>
            <span className="identity-dna-spectrum__legend-value">{slice.weight}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SliceRing({ slices }: { slices: DnaSliceViewModel[] }) {
  let cumulative = 0;
  const gradientStops = slices
    .map((slice) => {
      const start = cumulative;
      cumulative += slice.weight;
      const colorVar =
        slice.variant === "guinea"
          ? "var(--color-or-solaire)"
          : slice.variant === "accent"
            ? "var(--color-vert-energie)"
            : slice.variant === "emerging"
              ? "rgb(255 255 255 / 0.25)"
              : "rgb(255 255 255 / 0.45)";
      return `${colorVar} ${start}% ${cumulative}%`;
    })
    .join(", ");

  return (
    <div className="identity-dna-spectrum__ring-wrap">
      <div
        className="identity-dna-spectrum__ring"
        style={{ background: `conic-gradient(${gradientStops})` }}
        role="img"
        aria-label={slices.map((s) => s.ariaLabel).join(", ")}
      >
        <div className="identity-dna-spectrum__ring-hole">
          <span className="identity-dna-spectrum__ring-value">{slices[0]?.weight ?? 0}%</span>
          <span className="identity-dna-spectrum__ring-caption">{slices[0]?.label ?? "—"}</span>
        </div>
      </div>
      <ul className="identity-dna-spectrum__legend identity-dna-spectrum__legend--compact" role="list">
        {slices.map((slice) => (
          <li key={slice.id} className="identity-dna-spectrum__legend-item">
            <span
              className={`identity-dna-spectrum__legend-dot identity-dna-spectrum__bar-fill--${slice.variant}`}
              aria-hidden="true"
            />
            <span className="identity-dna-spectrum__legend-label">{slice.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SliceRadial({ slices }: { slices: DnaSliceViewModel[] }) {
  return (
    <div className="identity-dna-spectrum__radial">
      <ul className="identity-dna-spectrum__radial-list" role="list">
        {slices.map((slice, index) => (
          <li
            key={slice.id}
            className={`identity-dna-spectrum__radial-item identity-dna-spectrum__radial-item--${index}`}
          >
            <span
              className={`identity-dna-spectrum__radial-bubble identity-dna-spectrum__bar-fill--${slice.variant}`}
              style={{ transform: `scale(${0.55 + slice.weight / 140})` }}
              aria-hidden="true"
            />
            <span className="identity-dna-spectrum__radial-label">{slice.label}</span>
            <span className="identity-dna-spectrum__radial-value">{slice.weight}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const ProfileMusicalDnaSpectrum = memo(function ProfileMusicalDnaSpectrum({
  category,
}: ProfileMusicalDnaSpectrumProps) {
  const { slices, visualizationKind } = category;

  let visualization: ReactNode;
  switch (visualizationKind) {
    case "stack":
      visualization = <SliceStack slices={slices} />;
      break;
    case "ring":
      visualization = <SliceRing slices={slices} />;
      break;
    case "radial":
      visualization = <SliceRadial slices={slices} />;
      break;
    case "bar":
    default:
      visualization = <SliceBarList slices={slices} />;
      break;
  }

  return (
    <article
      className={`identity-dna-spectrum identity-dna-spectrum--${visualizationKind}`}
      aria-label={category.ariaLabel}
    >
      <header className="identity-dna-spectrum__header">
        <span className="identity-dna-spectrum__icon" aria-hidden="true">
          {category.icon}
        </span>
        <div className="identity-dna-spectrum__titles">
          <h3 className="identity-dna-spectrum__title">{category.title}</h3>
          {!category.isComputed ? (
            <span className="identity-dna-spectrum__badge">En formation</span>
          ) : null}
        </div>
      </header>
      {visualization}
    </article>
  );
});
