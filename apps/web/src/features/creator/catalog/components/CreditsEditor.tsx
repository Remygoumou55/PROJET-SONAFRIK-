"use client";

import { useEffect, useState } from "react";
import { Button } from "@sonafrik/ui";
import type { TrackCredit, TrackCreditRole } from "@sonafrik/types";
import { TRACK_CREDIT_ROLE_LABELS } from "@sonafrik/types/catalog";
import { useCatalogService } from "../hooks/useCatalog";

const CREDIT_ROLES: TrackCreditRole[] = [
  "artiste_principal", "featuring", "auteur", "compositeur",
  "producteur", "beatmaker", "mixage", "mastering",
];

interface CreditEntry {
  uid: string;
  contributorName: string;
  role: TrackCreditRole;
  contributorProfileId: null;
}

interface Props {
  trackId: string;
  stageName: string;
  onSaved?: () => void;
}

export function CreditsEditor({ trackId, stageName, onSaved }: Props) {
  const catalog = useCatalogService();
  const [credits, setCredits] = useState<CreditEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await catalog.getTrackCredits(trackId);
        if (!cancelled) {
          setCredits(
            existing.length > 0
              ? existing.map((c: TrackCredit, i: number) => ({
                  uid: `${c.role}-${i}`,
                  contributorName: c.contributor_name,
                  role: c.role,
                  contributorProfileId: null,
                }))
              : [{ uid: "principal-0", contributorName: stageName, role: "artiste_principal" as TrackCreditRole, contributorProfileId: null }],
          );
        }
      } catch (loadErr) {
        if (!cancelled) {
          setError(loadErr instanceof Error ? loadErr.message : "Impossible de charger les crédits.");
          setCredits([{ uid: "principal-0", contributorName: stageName, role: "artiste_principal", contributorProfileId: null }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  function addCredit() {
    setCredits((prev) => [
      ...(prev ?? []),
      { uid: Math.random().toString(36).slice(2), contributorName: "", role: "featuring", contributorProfileId: null },
    ]);
  }

  function removeCredit(index: number) {
    setCredits((prev) => (prev ?? []).filter((_, i) => i !== index));
  }

  function updateCredit(index: number, patch: Partial<CreditEntry>) {
    setCredits((prev) => (prev ?? []).map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  async function save() {
    if (!credits) return;
    setSaving(true);
    setError(null);
    try {
      await catalog.setTrackCredits({
        trackId,
        credits: credits
          .filter((c) => c.contributorName.trim().length > 0)
          .map((c, i) => ({
            contributorName: c.contributorName.trim(),
            role: c.role,
            displayOrder: i,
            contributorProfileId: null,
          })),
      });
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder les crédits. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || credits === null) {
    return (
      <div className="pt-2 text-xs" style={{ color: "var(--color-texte-desactive)" }}>
        Chargement des crédits…
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-2 border-t" style={{ borderColor: "var(--color-elevated)" }}>
      <p className="text-xs font-semibold uppercase" style={{ color: "var(--color-texte-secondaire)", letterSpacing: "0.5px" }}>
        Crédits
      </p>

      {credits.map((credit, i) => {
        const isPrincipal = credit.role === "artiste_principal";
        return (
          <div key={credit.uid} className="flex items-center gap-2">
            <select
              value={credit.role}
              disabled={isPrincipal}
              onChange={(e) => updateCredit(i, { role: e.target.value as TrackCreditRole })}
              className="text-xs rounded-lg px-2 py-1.5 flex-shrink-0"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-elevated)",
                color: isPrincipal ? "var(--color-texte-desactive)" : "var(--color-texte-principal)",
                minWidth: "110px",
              }}
            >
              {CREDIT_ROLES.map((role) => (
                <option key={role} value={role}>{TRACK_CREDIT_ROLE_LABELS[role]}</option>
              ))}
            </select>
            <input
              value={credit.contributorName}
              readOnly={isPrincipal}
              maxLength={100}
              onChange={(e) => updateCredit(i, { contributorName: e.target.value })}
              placeholder="Nom du contributeur"
              className="flex-1 text-sm rounded-lg px-2 py-1.5 min-w-0"
              style={{
                backgroundColor: isPrincipal ? "transparent" : "var(--color-surface)",
                border: isPrincipal ? "1px solid var(--color-elevated)" : "1px solid var(--color-bordure)",
                color: isPrincipal ? "var(--color-texte-desactive)" : "var(--color-texte-principal)",
              }}
            />
            {!isPrincipal && (
              <button
                onClick={() => removeCredit(i)}
                className="text-xs flex-shrink-0 hover:opacity-100 opacity-50 transition-opacity"
                style={{ color: "var(--color-danger)" }}
                aria-label="Supprimer"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={addCredit} className="text-xs hover:underline" style={{ color: "var(--color-vert-energie)" }}>
          + Ajouter un contributeur
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Sauvegarde…" : "Sauvegarder les crédits"}
        </Button>
      </div>
    </div>
  );
}
