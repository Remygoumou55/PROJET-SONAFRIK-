"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { Album } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS, RELEASE_TYPE_LABELS } from "@sonafrik/types";
import { useCatalogService } from "../hooks/useCatalog";

export function ReleaseList({ albums: initial, creatorId }: { albums: Album[]; creatorId: string }) {
  const router = useRouter();
  const catalog = useCatalogService();
  const [albums, setAlbums] = useState(initial);
  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<"album" | "single" | "ep">("single");
  const [upc, setUpc] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function uploadCover(albumId: string, file: File) {
    const { signedUrl, token } = await catalog.requestAssetUploadUrl({
      creatorId,
      assetType: "cover",
      contentType: file.type,
      albumId,
    });
    await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type, ...(token ? { "x-upsert": "true" } : {}) },
      body: file,
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <form onSubmit={createRelease} className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
            <select
              value={releaseType}
              onChange={(e) => setReleaseType(e.target.value as typeof releaseType)}
              className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="single">Single</option>
              <option value="album">Album</option>
              <option value="ep">EP</option>
            </select>
            <Input value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="UPC (12-14 chiffres)" />
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
            {album.upc ? <p className="text-texte-desactive text-xs">UPC · {album.upc}</p> : null}
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadCover(album.id, file);
                  }}
                />
                <span className="text-vert-energie text-sm hover:underline">Cover (URL signée)</span>
              </label>
              {album.publication_status === "draft" || album.publication_status === "rejected" ? (
                <Button size="sm" variant="outline" onClick={() => submit(album.id)}>
                  Soumettre à publication
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
