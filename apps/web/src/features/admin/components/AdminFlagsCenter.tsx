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
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          Feature Flags
        </h1>
        <span className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          {flags.filter((f) => f.enabled).length}/{flags.length} actifs
        </span>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(255,68,68,0.09)", color: "var(--color-erreur)", border: "1px solid rgba(255,68,68,0.2)" }}
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
              backgroundColor: "var(--color-surface)",
              border: `1px solid ${flag.enabled ? "var(--color-vert-energie)" : "var(--color-elevated)"}`,
              opacity: isPending ? 0.8 : 1,
              transition: "border-color 0.2s, opacity 0.15s",
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                  {flag.name}
                </p>
                {flag.description ? (
                  <p className="mt-1 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                    {flag.description}
                  </p>
                ) : null}
              </div>
              <span
                className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: flag.enabled ? "transparent" : "var(--color-surface)",
                  color: flag.enabled ? "var(--color-vert-energie)" : "var(--color-texte-desactive)",
                  border: `1px solid ${flag.enabled ? "var(--color-vert-energie)" : "var(--color-bordure)"}`,
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
                backgroundColor: flag.enabled ? "rgba(255,68,68,0.09)" : "rgba(0,210,106,0.04)",
                color: flag.enabled ? "var(--color-erreur)" : "var(--color-vert-energie)",
                border: `1px solid ${flag.enabled ? "rgba(255,68,68,0.2)" : "rgba(0,210,106,0.15)"}`,
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {flag.enabled ? "Désactiver" : "Activer"}
            </button>
          </div>
        ))}
      </div>

      {flags.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          Aucun feature flag défini.
        </p>
      ) : null}
    </div>
  );
}
