"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Album } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS, RELEASE_TYPE_LABELS } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared";
import { useCatalogService } from "../hooks/useCatalog";
import { CoverUploader } from "./CoverUploader";
import { CoverImage } from "@/components/CoverImage";

const UPC_MAX = 14;

export function ReleaseList({ albums: initial, creatorId }: { albums: Album[]; creatorId: string }) {
  const router = useRouter();
  const catalog = useCatalogService();
  const [albums, setAlbums] = useState(initial);
  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<"album" | "single" | "ep">("single");
  const [upc, setUpc] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCover, setExpandedCover] = useState<string | null>(null);

  async function createRelease(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const album = await catalog.createAlbum({
        title,
        releaseType,
        upc: upc || null,
      });
      setAlbums((current) => [album, ...current]);
      setTitle("");
      setUpc("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submit(albumId: string) {
    await catalog.submitAlbum(albumId);
    setAlbums((current) =>
      current.map((a) =>
        a.id === albumId ? { ...a, publication_status: "pending_review" } : a,
      ),
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <form onSubmit={createRelease} className="space-y-3">
            <div className="space-y-1">
              <Input
                value={title}
                maxLength={FIELD_LIMITS.ALBUM_TITLE}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre"
              />
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: title.length > FIELD_LIMITS.ALBUM_TITLE * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
                >
                  {title.length}/{FIELD_LIMITS.ALBUM_TITLE}
                </span>
              </div>
            </div>
            <select
              value={releaseType}
              onChange={(e) => setReleaseType(e.target.value as typeof releaseType)}
              className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="single">Single</option>
              <option value="album">Album</option>
              <option value="ep">EP</option>
            </select>
            <Input
              value={upc}
              maxLength={UPC_MAX}
              onChange={(e) => setUpc(e.target.value)}
              placeholder="UPC (12-14 chiffres)"
            />
            <Button type="submit" disabled={loading || title.length < 2}>
              Créer une sortie
            </Button>
          </form>
        </CardContent>
      </Card>

      {albums.map((album) => (
        <Card key={album.id}>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-texte-principal font-semibold">{album.title}</p>
              <Badge variant="outline">{RELEASE_TYPE_LABELS[album.release_type]}</Badge>
              <Badge variant="primary">{PUBLICATION_STATUS_LABELS[album.publication_status]}</Badge>
            </div>
            {album.publication_status === "rejected" && album.rejection_reason && (
              <p className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "rgba(255,68,68,0.09)", color: "var(--color-erreur)" }}>
                <span className="font-semibold">Motif de rejet : </span>{album.rejection_reason}
              </p>
            )}
            {album.upc ? <p className="text-texte-desactive text-xs">UPC · {album.upc}</p> : null}

            {/* Pochette actuelle */}
            {album.cover_path && (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <CoverImage coverPath={album.cover_path} alt={album.title} imgSizes="64px" />
              </div>
            )}

            {/* Upload pochette */}
            {expandedCover === album.id ? (
              <div className="pt-1">
                <CoverUploader
                  albumId={album.id}
                  creatorId={creatorId}
                  onSuccess={() => {
                    setExpandedCover(null);
                    router.refresh();
                  }}
                />
                <button
                  onClick={() => setExpandedCover(null)}
                  className="mt-2 text-xs"
                  style={{ color: "var(--color-texte-desactive)" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExpandedCover(album.id)}
                  className="text-sm hover:underline"
                  style={{ color: "var(--color-vert-energie)" }}
                >
                  Ajouter / changer la pochette
                </button>
                {album.publication_status === "draft" || album.publication_status === "rejected" ? (
                  <Button size="sm" variant="outline" onClick={() => submit(album.id)}>
                    Soumettre à publication
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
