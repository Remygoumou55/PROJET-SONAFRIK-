"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface AdminSearchBarProps {
  placeholder?: string;
}

export function AdminSearchBar({ placeholder = "Rechercher..." }: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();
  const debouncedQuery = useDebounce(query, 300);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = debouncedQuery.trim();
    const currentQuery = searchParams.get("q") ?? "";
    if (nextQuery === currentQuery) return;

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }
    params.delete("page");
    const next = params.toString();
    const target = next ? `${pathname}?${next}` : pathname;
    startTransition(() => {
      router.push(target);
    });
  }, [debouncedQuery, pathname, router, searchParams]);

  return (
    <div className="admin-search-wrap">
      <span className="admin-search-icon" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="admin-search-input"
        aria-label={placeholder}
      />
    </div>
  );
}
