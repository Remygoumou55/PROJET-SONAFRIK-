"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const FILTERS = [
  { key: "all", label: "Tout", emoji: "🌍" },
  { key: "guinee", label: "Guinée", emoji: "🇬🇳" },
  { key: "afrique", label: "Afrique", emoji: "🌍" },
  { key: "diaspora", label: "Diaspora", emoji: "✈️" },
] as const;

export function HeaderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("category") ?? "all";

  const handleFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "all") {
        params.delete("category");
      } else {
        params.set("category", key);
      }
      const query = params.toString();
      router.push(query ? `/listen?${query}` : "/listen");
    },
    [router, searchParams],
  );

  return (
    <div className="header-filters" role="tablist" aria-label="Filtres musicaux">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`header-filter-btn${isActive ? " active" : ""}`}
            onClick={() => handleFilter(filter.key)}
          >
            <span className="filter-emoji" aria-hidden="true">
              {filter.emoji}
            </span>
            <span className="filter-label">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
