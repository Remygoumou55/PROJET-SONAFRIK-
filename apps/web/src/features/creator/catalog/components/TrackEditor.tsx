"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Input, buttonVariants } from "@sonafrik/ui";
import type { Genre, Track } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared/field-limits";
import { useCatalogService } from "../hooks/useCatalog";
import { AudioUploader, type AudioUploaderHandle } from "./AudioUploader";
import { CreditsEditor } from "./CreditsEditor";

interface Props {
  track: Track;
  creatorId: string;
  stageName: string;
  initialGenreId?: string;
}

export function TrackEditor({ track: initial, creatorId, stageName, initialGenreId = "" }: Props) {
  const catalog = useCatalogService();
  const router = useRouter();
  const audioRef = useRef<AudioUploaderHandle>(null);

  const [title, setTitle] = useState(initial.title);
  const [language, setLanguage] = useState(initial.language || "fr");
  const [genreId, setGenreId] = useState(initialGenreId);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [explicit, setExplicit] = useState(initial.explicit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void catalog
      .getGenres()
      .then((list) => {
        if (!cancelled) setGenres(list.filter((g) => g.is_active));
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les genres.");
      });
    return () => { cancelled = true; };
  }, [catalog]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await catalog.updateTrack(initial.id, {
        title: title.trim(),
        language: language.length === 2 ? language : undefined,
        explicit,
        genreIds: genreId ? [genreId] : [],
      });
      router.push("/creator/catalog/tracks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReplaceAudio() {
    if (!audioRef.current) return;
    setUploading(true);
    setError(null);
    try {
      await audioRef.current.triggerUpload();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du remplacement audio.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-texte-principal text-lg font-semibold">Modifier le morceau</h2>
        <Link href="/creator/catalog/tracks" className={buttonVariants({ variant: "outline", size: "sm" })}>
          ← Retour à la liste
        </Link>
      </div>

      {error ? (
        <p className="text-sm" role="alert" style={{ color: "var(--color-erreur)" }}>
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSave} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-texte-secondaire text-xs font-semibold uppercase">Titre</span>
              <Input
                value={title}
                maxLength={FIELD_LIMITS.TRACK_TITLE}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-texte-secondaire text-xs font-semibold uppercase">Genre</span>
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un genre</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-texte-secondaire text-xs font-semibold uppercase">Langue</span>
              <Input
                value={language}
                maxLength={2}
                onChange={(e) => setLanguage(e.target.value.toLowerCase())}
                placeholder="fr"
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={explicit}
                onChange={(e) => setExplicit(e.target.checked)}
              />
              <span className="text-texte-principal text-sm">Contenu explicite</span>
            </label>

            <Button type="submit" disabled={saving || title.trim().length < 2}>
              {saving ? "Sauvegarde…" : "Enregistrer les métadonnées"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <CreditsEditor
            trackId={initial.id}
            stageName={stageName}
            onSaved={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <h3 className="text-texte-principal font-semibold">Remplacer le fichier audio</h3>
          <p className="text-texte-secondaire text-sm">MP3 · M4A · WAV — max 100 Mo</p>
          <AudioUploader
            ref={audioRef}
            trackId={initial.id}
            creatorId={creatorId}
            onFileReady={() => setAudioReady(true)}
            onFileCleared={() => setAudioReady(false)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading || !audioReady}
            onClick={() => void handleReplaceAudio()}
          >
            {uploading ? "Envoi en cours…" : "Envoyer le nouveau fichier"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
