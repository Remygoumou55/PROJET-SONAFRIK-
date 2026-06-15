"use client";

import { useState, useTransition } from "react";
import type { FeatureFlag } from "@sonafrik/types";
import { toggleFeatureFlagAction } from "../actions/admin.actions";

interface Props {
  flags: FeatureFlag[];
}

export function AdminFlagsCenter({ flags: initial }: Props) {
  const [flags, setFlags] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(name: string, current: boolean) {
    setError(null);
    const next = !current;
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) => (f.name === name ? { ...f, enabled: next } : f)),
    );
    startTransition(async () => {
      const result = await toggleFeatureFlagAction(name, next);
      if (result.error) {
        setError(result.error);
        // Rollback
        setFlags((prev) =>
          prev.map((f) => (f.name === name ? { ...f, enabled: current } : f)),
        );
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>
          Feature Flags
        </h1>
        <span className="text-sm" style={{ color: "#555555" }}>
          {flags.filter((f) => f.enabled).length}/{flags.length} actifs
        </span>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "#2A1A1A", color: "#FF6B6B", border: "1px solid #3A2020" }}
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {flags.map((flag) => (
          <div
            key={flag.name}
            className="rounded-lg p-4"
            style={{
              backgroundColor: "#1A1A1A",
              border: `1px solid ${flag.enabled ? "#00CC44" : "#2A2A2A"}`,
              opacity: isPending ? 0.8 : 1,
              transition: "border-color 0.2s, opacity 0.15s",
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  {flag.name}
                </p>
                {flag.description ? (
                  <p className="mt-1 text-xs" style={{ color: "#555555" }}>
                    {flag.description}
                  </p>
                ) : null}
              </div>
              <span
                className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: flag.enabled ? "#00331100" : "#1A1A1A",
                  color: flag.enabled ? "#00CC44" : "#555555",
                  border: `1px solid ${flag.enabled ? "#00CC44" : "#333333"}`,
                }}
              >
                {flag.enabled ? "ON" : "OFF"}
              </span>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => toggle(flag.name, flag.enabled)}
              className="w-full rounded py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: flag.enabled ? "#2A1A1A" : "#0A2A1A",
                color: flag.enabled ? "#FF6B6B" : "#00CC44",
                border: `1px solid ${flag.enabled ? "#3A2020" : "#003311"}`,
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {flag.enabled ? "Désactiver" : "Activer"}
            </button>
          </div>
        ))}
      </div>

      {flags.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: "#555555" }}>
          Aucun feature flag défini.
        </p>
      ) : null}
    </div>
  );
}
