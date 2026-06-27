"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ArtistResult, TrackWithMeta } from "@sonafrik/types";
import { CoverImage } from "@/components/CoverImage";
import { getInitials } from "@/lib/utils";
import { useSmartSearch } from "../hooks/useSmartSearch";

type ResultKind = "artist" | "track";

interface FlatResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  coverPath: string | null;
  href: string;
  roundCover: boolean;
}

function toFlatResults(
  artists: ArtistResult[],
  tracks: TrackWithMeta[],
): FlatResult[] {
  const artistItems: FlatResult[] = artists.map((artist) => ({
    kind: "artist",
    id: artist.creator_id,
    title: artist.stage_name,
    subtitle: artist.genres[0] ?? "Artiste",
    coverPath: artist.cover_path,
    href: `/listen/artist/${artist.creator_id}`,
    roundCover: true,
  }));

  const trackItems: FlatResult[] = tracks.map((track) => ({
    kind: "track",
    id: track.id,
    title: track.title,
    subtitle: track.artist_name ?? "Artiste",
    coverPath: track.cover_url ?? null,
    href: `/listen/track/${track.id}`,
    roundCover: false,
  }));

  return [...artistItems, ...trackItems];
}

function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="search-highlight">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

const TYPE_LABELS: Record<ResultKind, string> = {
  artist: "Artiste",
  track: "Morceau",
};

export function SmartSearchBar() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery, results, isLoading, clear } = useSmartSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const flatResults = useMemo(
    () => toFlatResults(results?.artists ?? [], results?.tracks ?? []),
    [results],
  );

  const hasQuery = query.trim().length > 0;
  const showDropdown = isOpen && hasQuery;
  const showNoResults =
    showDropdown &&
    !isLoading &&
    debouncedQuery.length >= 1 &&
    flatResults.length === 0;

  const handleSelectResult = useCallback(
    (result: FlatResult) => {
      router.push(result.href);
      clear();
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [router, clear],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (!showDropdown || flatResults.length === 0) return;
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      if (!showDropdown || flatResults.length === 0) return;
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        handleSelectResult(flatResults[activeIndex]);
        return;
      }
      if (query.trim().length > 0) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setActiveIndex(-1);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setActiveIndex(-1);
    }
  }, [hasQuery]);

  return (
    <div className="smart-search-wrap" role="search">
      <div className="smart-search-input-wrap">
        <span className="smart-search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasQuery) setIsOpen(true);
          }}
          placeholder="Rechercher..."
          className="smart-search-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="smart-search-dropdown"
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
        />
        {isLoading ? (
          <span className="smart-search-loading" aria-label="Recherche en cours">
            <span className="ssl-dot" />
            <span className="ssl-dot" />
            <span className="ssl-dot" />
          </span>
        ) : null}
        {hasQuery && !isLoading ? (
          <button
            type="button"
            className="smart-search-clear"
            onClick={() => {
              clear();
              setIsOpen(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div
          ref={dropdownRef}
          id="smart-search-dropdown"
          className="smart-search-dropdown"
          role="listbox"
          aria-label="Résultats de recherche"
        >
          {showNoResults ? (
            <div className="search-no-results">
              <span aria-hidden="true">🎵</span>
              <p>
                Aucun résultat pour &ldquo;<strong>{debouncedQuery}</strong>&rdquo;
              </p>
            </div>
          ) : (
            <>
              {(["artist", "track"] as const).map((kind) => {
                const group = flatResults.filter((item) => item.kind === kind);
                if (group.length === 0) return null;

                return (
                  <div key={kind} className="search-group">
                    <p className="search-group-label">{TYPE_LABELS[kind]}s</p>
                    {group.map((result) => {
                      const globalIndex = flatResults.indexOf(result);
                      const isActive = globalIndex === activeIndex;

                      return (
                        <button
                          key={`${result.kind}-${result.id}`}
                          id={`search-result-${globalIndex}`}
                          type="button"
                          className={`search-result-item${isActive ? " active" : ""}`}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelectResult(result)}
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                        >
                          <div
                            className={`search-result-cover${result.roundCover ? " search-result-cover--round" : ""}`}
                          >
                            {result.kind === "artist" && !result.coverPath ? (
                              <span className="search-result-initials">
                                {getInitials(result.title)}
                              </span>
                            ) : (
                              <CoverImage
                                coverPath={result.coverPath}
                                alt={result.title}
                                artistName={result.subtitle}
                                imgSizes="36px"
                              />
                            )}
                          </div>
                          <div className="search-result-meta">
                            <p className="search-result-title">
                              {highlightMatch(result.title, query)}
                            </p>
                            <p className="search-result-subtitle">{result.subtitle}</p>
                          </div>
                          <span className="search-result-type">{TYPE_LABELS[result.kind]}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {flatResults.length > 0 ? (
                <button
                  type="button"
                  className="search-see-all"
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    setIsOpen(false);
                    setActiveIndex(-1);
                  }}
                >
                  Voir tous les résultats pour &ldquo;{query}&rdquo; →
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
