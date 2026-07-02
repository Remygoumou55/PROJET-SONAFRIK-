"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Badge, Card, CardContent } from "@sonafrik/ui";
import type { Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types/catalog";
import { PublicationWizard } from "./PublicationWizard";

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
  const [tracks, setTracks] = useState(initial);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null);
  const [expandedCredits, setExpandedCredits] = useState<string | null>(null);

  function handleWizardComplete() {
    setWizardOpen(false);
    // Reload track list by refreshing the page
    window.location.reload();
  }

  if (wizardOpen) {
    return (
      <PublicationWizard
        creatorId={creatorId}
        stageName={stageName}
        onComplete={handleWizardComplete}
        onCancel={() => setWizardOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* CTA — Nouveau morceau */}
      <div className="pub-wiz-entry">
        <div className="pub-wiz-entry__text">
          <p className="pub-wiz-entry__title">Publier un nouveau morceau</p>
          <p className="pub-wiz-entry__sub">Workflow guidé en 4 étapes · Audio + Pochette + Métadonnées</p>
        </div>
        <button className="pub-wiz-entry__btn" onClick={() => setWizardOpen(true)}>
          + Publier
        </button>
      </div>

      {/* Liste des morceaux existants */}
      {tracks.length > 0 && (
        <div className="space-y-3">
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
      )}

      {tracks.length === 0 && (
        <p className="text-center text-sm" style={{ color: "var(--color-texte-desactive)", padding: "2rem 0" }}>
          Aucun morceau publié pour le moment.
        </p>
      )}
    </div>
  );
}
