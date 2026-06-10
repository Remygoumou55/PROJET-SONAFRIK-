"use client";

import { useState } from "react";
import { useSearch } from "../hooks/useSearch";
import { SearchResults } from "./SearchResults";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const { results, isSearching, error, search, clearSearch } = useSearch();

  const handleChange = (value: string) => {
    setQuery(value);
    search(value);
    if (!value) clearSearch();
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#FFFFFF" }}>
        Recherche
      </h1>
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <circle cx="8" cy="8" r="5.5" stroke="#555555" strokeWidth="1.5" />
          <path d="M12 12L16 16" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Artiste, morceau, album…"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: "#1F1F1F",
            color: "#FFFFFF",
            border: "1px solid #333333",
          }}
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(""); clearSearch(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#555555" }}
            aria-label="Effacer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm mb-4" style={{ color: "#A0A0A0" }}>
          {error}
        </p>
      )}
      <SearchResults results={results} isSearching={isSearching} />
      {!query && (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🎵</p>
          <p className="font-semibold mb-1" style={{ color: "#FFFFFF" }}>
            Recherchez votre musique
          </p>
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            Morceaux, albums, artistes africains
          </p>
        </div>
      )}
    </div>
  );
}
