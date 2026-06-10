"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types";
import { useCatalogService } from "../hooks/useCatalog";

export function TrackList({ tracks: initial, creatorId }: { tracks: Track[]; creatorId: string }) {
  const router = useRouter();
  const catalog = useCatalogService();
  const [tracks, setTracks] = useState(initial);
  const [title, setTitle] = useState("");
  const [isrc, setIsrc] = useState("");
  const [loading, setLoading] = useState(false);

  async function createTrack(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const track = await catalog.createTrack({
        title,
        isrc: isrc || null,
      });
      setTracks((current) => [track, ...current]);
      setTitle("");
      setIsrc("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function uploadAudio(trackId: string, file: File) {
    const format = file.type === "audio/mpeg" ? "mp3" : "aac";
    const { signedUrl, token } = await catalog.requestAssetUploadUrl({
      creatorId,
      assetType: "audio",
      contentType: file.type,
      trackId,
      format,
    });
    await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type, ...(token ? { "x-upsert": "true" } : {}) },
      body: file,
    });
    router.refresh();
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
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp4"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAudio(track.id, file);
                  }}
                />
                <span className="text-vert-energie text-sm hover:underline">Audio master (URL signée)</span>
              </label>
              {track.publication_status === "draft" || track.publication_status === "rejected" ? (
                <Button size="sm" variant="outline" onClick={() => submit(track.id)}>
                  Soumettre
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
