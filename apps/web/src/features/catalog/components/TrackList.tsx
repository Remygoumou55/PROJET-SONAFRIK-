"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types";
import { useCatalogService } from "../hooks/useCatalog";
import { AudioUploader } from "./AudioUploader";

export function TrackList({ tracks: initial, creatorId }: { tracks: Track[]; creatorId: string }) {
  const router = useRouter();
  const catalog = useCatalogService();
  const [tracks, setTracks] = useState(initial);
  const [title, setTitle] = useState("");
  const [isrc, setIsrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null);

  async function createTrack(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const track = await catalog.createTrack({ title, isrc: isrc || null });
      setTracks((current) => [track, ...current]);
      setTitle("");
      setIsrc("");
      router.refresh();
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
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <form onSubmit={createTrack} className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du morceau" />
            <Input
              value={isrc}
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
                    router.refresh();
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
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
