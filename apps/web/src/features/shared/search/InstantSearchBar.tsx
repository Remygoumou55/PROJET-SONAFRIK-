"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface InstantSearchBarProps {
  value: string;
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  debounceMs?: number;
  className?: string;
}

/** Recherche instantanée SONAFRIK — filtre dès la saisie, sans bouton de validation. */
export function InstantSearchBar({
  value,
  onDebouncedChange,
  placeholder = "Rechercher…",
  ariaLabel,
  debounceMs = 250,
  className = "",
}: InstantSearchBarProps) {
  const inputId = useId();
  const [input, setInput] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipMountRef = useRef(true);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (skipMountRef.current) {
      skipMountRef.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDebouncedChange(input);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input, debounceMs, onDebouncedChange]);

  return (
    <div className={`instant-search ${className}`.trim()}>
      <span className="instant-search__icon" aria-hidden="true">
        🔍
      </span>
      <input
        id={inputId}
        type="search"
        className="instant-search__input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
    </div>
  );
}
