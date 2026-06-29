"use client";

import { memo } from "react";
import type { FraudCategoryFilter, FraudFilterState, FraudPeriodFilter, FraudStatusFilter } from "../../lib/fraud/useFraudIncidentFilters";

interface Props {
  filters: FraudFilterState;
  onChange: (patch: Partial<FraudFilterState>) => void;
  resultCount: number;
  totalLoaded: number;
  ssotTotal?: number;
}

function Pill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fraud-filter-pill${active ? " fraud-filter-pill--active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function FraudIncidentToolbarView({ filters, onChange, resultCount, totalLoaded, ssotTotal }: Props) {
  return (
    <div className="fraud-toolbar">
      <div className="fraud-toolbar__search-wrap">
        <span className="fraud-toolbar__search-icon" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          className="fraud-toolbar__search"
          placeholder="Rechercher utilisateur, artiste, titre, IP, pays, appareil…"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          aria-label="Recherche instantanée"
        />
      </div>

      <div className="fraud-toolbar__meta">
        {resultCount} affiché{resultCount !== 1 ? "s" : ""}
        {typeof ssotTotal === "number" ? ` · ${ssotTotal.toLocaleString("fr-FR")} SSOT` : null}
        {totalLoaded > 0 ? ` · ${totalLoaded} chargés` : null}
      </div>

      <div className="fraud-toolbar__groups">
        <div className="fraud-toolbar__group" role="group" aria-label="Statut">
          {(
            [
              ["all", "Tous"],
              ["untreated", "Non traités"],
              ["treated", "Traités"],
              ["critical", "Critiques"],
            ] as const
          ).map(([key, label]) => (
            <Pill
              key={key}
              active={filters.status === key}
              label={label}
              onClick={() => onChange({ status: key as FraudStatusFilter })}
            />
          ))}
        </div>

        <div className="fraud-toolbar__group" role="group" aria-label="Période">
          {(
            [
              ["all", "Toute période"],
              ["today", "Aujourd'hui"],
              ["week", "Cette semaine"],
            ] as const
          ).map(([key, label]) => (
            <Pill
              key={key}
              active={filters.period === key}
              label={label}
              onClick={() => onChange({ period: key as FraudPeriodFilter })}
            />
          ))}
        </div>

        <div className="fraud-toolbar__group fraud-toolbar__group--scroll" role="group" aria-label="Catégorie">
          {(
            [
              ["all", "Tous"],
              ["fraud", "Fraudes"],
              ["streaming", "Streaming"],
              ["artists", "Artistes"],
              ["users", "Utilisateurs"],
              ["country", "Pays"],
              ["device", "Appareil"],
              ["ip", "IP"],
            ] as const
          ).map(([key, label]) => (
            <Pill
              key={key}
              active={filters.category === key}
              label={label}
              onClick={() => onChange({ category: key as FraudCategoryFilter })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const FraudIncidentToolbar = memo(FraudIncidentToolbarView);
