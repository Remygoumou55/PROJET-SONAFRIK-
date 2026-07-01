"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types/catalog";
import { FIELD_LIMITS } from "@sonafrik/shared/field-limits";
import { publishCreatorLdseEvent } from "@/features/shared/ldse/creator/publishCreatorLdseEvent";
import { CREATOR_LDSE_EVENTS } from "@/features/shared/ldse/creator/creator-ldse-config";
import { useCatalogService } from "../hooks/useCatalog";

const AudioUploader = dynamic(
  () => import("./AudioUploader").then((m) => ({ default: m.AudioUploader })),
  { ssr: false, loading: () => <p className="text-texte-desactive text-xs">Chargement…</p> },
);

const CreditsEditor = dynamic(
  () => import("./CreditsEditor").then((m) => ({ default: m.CreditsEditor })),
  { ssr: false, loading: () => <p className="text-texte-desactive text-xs">Chargement…</p> },
);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null);
  const [expandedCredits, setExpandedCredits] = useState<string | null>(null);

  async function createTrack(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const track = await catalog.createTrack({ title, isrc: null });
      setTracks((current) => [track, ...current]);
      publishCreatorLdseEvent(CREATOR_LDSE_EVENTS.trackUpdated, creatorId, { trackId: track.id });
      setTitle("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer le morceau. Réessayez.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(trackId: string) {
    await catalog.submitTrack(trackId);
    setTracks((current) =>
      current.map((t) => t.id === trackId ? { ...t, publication_status: "pending_review" } : t),
    );
    publishCreatorLdseEvent(CREATOR_LDSE_EVENTS.trackPublished, creatorId, { trackId });
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
                  style={{ color: title.length > FIELD_LIMITS.TRACK_TITLE * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
                >
                  {title.length}/{FIELD_LIMITS.TRACK_TITLE}
                </span>
              </div>
            </div>
            <Button type="submit" disabled={loading || title.length < 2}>
              Créer un morceau
            </Button>
            {error ? (
              <p className="text-sm" style={{ color: "var(--color-erreur)" }} role="alert">
                {error}
              </p>
            ) : null}
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

            {expandedAudio === track.id ? (
              <div className="pt-1">
                <AudioUploader
                  trackId={track.id}
                  creatorId={creatorId}
                  onSuccess={(dur) => {
                    setExpandedAudio(null);
                    setTracks((current) =>
                      current.map((t) => t.id === track.id ? { ...t, duration_seconds: dur } : t),
                    );
                  }}
                />
                <button
                  onClick={() => setExpandedAudio(null)}
                  className="mt-2 text-xs"
                  style={{ color: "var(--color-texte-desactive)" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExpandedAudio(track.id)}
                  className="text-sm hover:underline"
                  style={{ color: "var(--color-vert-energie)" }}
                >
                  {track.duration_seconds ? "Remplacer le fichier audio" : "Ajouter le fichier audio"}
                </button>
                {(track.publication_status === "draft" || track.publication_status === "rejected") ? (
                  <Button size="sm" variant="outline" onClick={() => submit(track.id)}>
                    Soumettre
                  </Button>
                ) : null}
                <button
                  onClick={() => setExpandedCredits((prev) => (prev === track.id ? null : track.id))}
                  className="text-sm hover:underline"
                  style={{ color: "var(--color-texte-secondaire)" }}
                >
                  Crédits
                </button>
              </div>
            )}

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
