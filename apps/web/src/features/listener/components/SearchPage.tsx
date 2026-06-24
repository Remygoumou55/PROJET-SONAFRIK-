"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { SearchType } from "@sonafrik/types";
import { useSearch } from "../hooks/useSearch";

const SearchResults = dynamic(
  () => import("./SearchResults").then((m) => ({ default: m.SearchResults })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 flex justify-center">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </div>
    ),
  },
);

const TABS: { id: SearchType; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "tracks", label: "Morceaux" },
  { id: "artists", label: "Artistes" },
  { id: "albums", label: "Albums" },
  { id: "playlists", label: "Playlists" },
  { id: "beats", label: "Beats" },
];

interface Props {
  initialGenre?: string;
  initialQuery?: string;
}

export function SearchPage({ initialGenre, initialQuery }: Props) {
  const seed = initialQuery ?? initialGenre ?? "";
  const [query, setQuery] = useState(seed);
  const [activeGenre, setActiveGenre] = useState<string | undefined>(initialGenre);
  const [activeTab, setActiveTab] = useState<SearchType>("all");
  const { results, isSearching, error, search, clearSearch } = useSearch();

  useEffect(() => {
    if (seed.trim().length >= 2) {
      search(seed, activeTab);
    }
  }, [seed, search, activeTab]);

  const handleChange = (value: string) => {
    setQuery(value);
    setActiveGenre(undefined);
    if (!value) { clearSearch(); return; }
    search(value, activeTab);
  };

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab);
    if (query.trim().length >= 2) {
      search(query, tab);
    }
  };

  const clearGenreFilter = () => {
    setActiveGenre(undefined);
    setQuery("");
    clearSearch();
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-texte-principal)" }}>
        Recherche
      </h1>

      {activeGenre && (
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(0,210,106,0.08)", color: "var(--color-vert-energie)", border: "1px solid rgba(0,210,106,0.19)" }}
          >
            <svg width={10} height={10} viewBox="0 0 24 24" fill="var(--color-vert-energie)">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Genre : {activeGenre}
            <button
              onClick={clearGenreFilter}
              className="ml-1 flex items-center justify-center w-3.5 h-3.5 rounded-full transition-colors hover:opacity-80"
              aria-label={`Retirer le filtre ${activeGenre}`}
            >
              <svg width={8} height={8} viewBox="0 0 8 8" fill="none" stroke="var(--color-vert-energie)" strokeWidth={1.5} strokeLinecap="round">
                <path d="M1 1l6 6M7 1L1 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <circle cx="8" cy="8" r="5.5" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
          <path d="M12 12L16 16" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={activeGenre ? `Chercher dans ${activeGenre}…` : "Artiste, morceau, album, beat…"}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: "var(--color-card)",
            color: "var(--color-texte-principal)",
            border: "1px solid var(--color-bordure)",
          }}
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setActiveGenre(undefined); clearSearch(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-texte-desactive)" }}
            aria-label="Effacer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Onglets — visibles dès que la saisie est active ou des résultats existent */}
      {(query.trim().length >= 2 || results !== null) && (
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? "var(--color-vert-energie)" : "var(--color-card)",
                color: activeTab === tab.id ? "var(--color-noir-profond)" : "var(--color-texte-secondaire)",
                border: `1px solid ${activeTab === tab.id ? "var(--color-vert-energie)" : "var(--color-bordure)"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm mb-4" role="alert" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <div aria-live="polite" aria-atomic="false">
        <SearchResults
          results={results}
          isSearching={isSearching}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {!query && !activeGenre && (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🎵</p>
          <p className="font-semibold mb-1" style={{ color: "var(--color-texte-principal)" }}>
            Recherchez votre musique
          </p>
          <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
            Morceaux, albums, artistes, playlists, beats africains
          </p>
        </div>
      )}
    </div>
  );
}
