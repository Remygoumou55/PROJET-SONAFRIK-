"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Track, TrackCredit, TrackCreditRole } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS, TRACK_CREDIT_ROLE_LABELS } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared";
import { useCatalogService } from "../hooks/useCatalog";
import { AudioUploader } from "./AudioUploader";

const ISRC_MAX = 12;

const CREDIT_ROLES: TrackCreditRole[] = [
  "artiste_principal",
  "featuring",
  "auteur",
  "compositeur",
  "producteur",
  "beatmaker",
  "mixage",
  "mastering",
];

interface CreditEntry {
  uid: string;
  contributorName: string;
  role: TrackCreditRole;
  contributorProfileId: null;
}

function CreditsEditor({
  trackId,
  stageName,
  onClose,
}: {
  trackId: string;
  stageName: string;
  onClose: () => void;
}) {
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
              ? existing.map((c: TrackCredit, i) => ({
                  uid: `${c.role}-${i}`,
                  contributorName: c.contributor_name,
                  role: c.role,
                  contributorProfileId: null,
                }))
              : [{ uid: "principal-0", contributorName: stageName, role: "artiste_principal" as TrackCreditRole, contributorProfileId: null }],
          );
        }
      } catch {
        if (!cancelled) {
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
    setCredits((prev) =>
      (prev ?? []).map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
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
      onClose();
    } catch {
      setError("Impossible de sauvegarder les crédits. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || credits === null) {
    return (
      <div className="pt-2 text-xs" style={{ color: "#555555" }}>
        Chargement des crédits…
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-2 border-t" style={{ borderColor: "#2A2A2A" }}>
      <p className="text-xs font-semibold uppercase" style={{ color: "#A0A0A0", letterSpacing: "0.5px" }}>
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
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                color: isPrincipal ? "#555555" : "#FFFFFF",
                minWidth: "110px",
              }}
            >
              {CREDIT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {TRACK_CREDIT_ROLE_LABELS[role]}
                </option>
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
                backgroundColor: isPrincipal ? "transparent" : "#1A1A1A",
                border: isPrincipal ? "1px solid #2A2A2A" : "1px solid #333333",
                color: isPrincipal ? "#555555" : "#FFFFFF",
              }}
            />
            {!isPrincipal && (
              <button
                onClick={() => removeCredit(i)}
                className="text-xs flex-shrink-0 hover:opacity-100 opacity-50 transition-opacity"
                style={{ color: "#FF4D4F" }}
                aria-label="Supprimer"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={addCredit}
          className="text-xs hover:underline"
          style={{ color: "#00D26A" }}
        >
          + Ajouter un contributeur
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#FF4D4F" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Sauvegarde…" : "Sauvegarder les crédits"}
        </Button>
        <button
          onClick={onClose}
          className="text-xs hover:underline"
          style={{ color: "#555555" }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export function TrackList({
  tracks: initial,
  creatorId,
  stageName,
}: {
  tracks: Track[];
  creatorId: string;
  stageName: string;
}) {
  const catalog = useCatalogService();
  const [tracks, setTracks] = useState(initial);
  const [title, setTitle] = useState("");
  const [isrc, setIsrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null);
  const [expandedCredits, setExpandedCredits] = useState<string | null>(null);

  async function createTrack(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const track = await catalog.createTrack({ title, isrc: isrc || null });
      setTracks((current) => [track, ...current]);
      setTitle("");
      setIsrc("");
    } finally {
      setLoading(false);
    }
  }

  async function submit(trackId: string) {
    await catalog.submitTrack(trackId);
    setTracks((current) =>
      current.map((t) =>
        t.id === trackId ? { ...t, publication_status: "pending_review" } : t,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <form onSubmit={createTrack} className="space-y-3">
            <div className="space-y-1">
              <Input
                value={title}
                maxLength={FIELD_LIMITS.TRACK_TITLE}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du morceau"
              />
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: title.length > FIELD_LIMITS.TRACK_TITLE * 0.85 ? "#FFC20E" : "#555555" }}
                >
                  {title.length}/{FIELD_LIMITS.TRACK_TITLE}
                </span>
              </div>
            </div>
            <Input
              value={isrc}
              maxLength={ISRC_MAX}
              onChange={(e) => setIsrc(e.target.value.toUpperCase())}
              placeholder="ISRC (ex. GNA012600001)"
            />
            <Button type="submit" disabled={loading || title.length < 2}>
              Créer un morceau
            </Button>
          </form>
        </CardContent>
      </Card>

      {tracks.map((track) => (
        <Card key={track.id}>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-texte-principal font-semibold">{track.title}</p>
              <Badge variant="primary">{PUBLICATION_STATUS_LABELS[track.publication_status]}</Badge>
            </div>
            {track.isrc ? <p className="text-texte-desactive text-xs">ISRC · {track.isrc}</p> : null}
            {track.duration_seconds ? (
              <p className="text-texte-desactive text-xs">
                Durée · {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
              </p>
            ) : null}

            {/* Upload audio */}
            {expandedAudio === track.id ? (
              <div className="pt-1">
                <AudioUploader
                  trackId={track.id}
                  creatorId={creatorId}
                  onSuccess={(dur) => {
                    setExpandedAudio(null);
                    setTracks((current) =>
                      current.map((t) =>
                        t.id === track.id ? { ...t, duration_seconds: dur } : t,
                      ),
                    );
                  }}
                />
                <button
                  onClick={() => setExpandedAudio(null)}
                  className="mt-2 text-xs"
                  style={{ color: "#555555" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExpandedAudio(track.id)}
                  className="text-sm hover:underline"
                  style={{ color: "#00D26A" }}
                >
                  {track.duration_seconds ? "Remplacer le fichier audio" : "Ajouter le fichier audio"}
                </button>
                {track.publication_status === "draft" || track.publication_status === "rejected" ? (
                  <Button size="sm" variant="outline" onClick={() => submit(track.id)}>
                    Soumettre
                  </Button>
                ) : null}
                <button
                  onClick={() =>
                    setExpandedCredits((prev) => (prev === track.id ? null : track.id))
                  }
                  className="text-sm hover:underline"
                  style={{ color: "#A0A0A0" }}
                >
                  Crédits
                </button>
              </div>
            )}

            {/* Éditeur de crédits */}
            {expandedCredits === track.id && (
              <CreditsEditor
                trackId={track.id}
                stageName={stageName}
                onClose={() => setExpandedCredits(null)}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
