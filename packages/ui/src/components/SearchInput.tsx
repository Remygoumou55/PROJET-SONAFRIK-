import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Input } from "./Input";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  onClear?: () => void;
}

export function SearchInput({
  className,
  label = "Rechercher",
  placeholder = "Rechercher…",
  value,
  onClear,
  ...props
}: SearchInputProps) {
  const hasValue = value !== undefined && value !== "";

  return (
    <div className="relative w-full">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t8-silver-deep)]"
        aria-hidden="true"
      >
        <SearchIcon />
      </span>
      <Input
        type="search"
        label={label}
        placeholder={placeholder}
        value={value}
        className={cn("pl-10 pr-10", className)}
        role="searchbox"
        {...props}
      />
      {hasValue && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--t8-silver)] hover:text-[var(--t8-pearl)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--t8-primary-lavender)]"
          aria-label="Effacer la recherche"
        >
          <ClearIcon />
        </button>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
