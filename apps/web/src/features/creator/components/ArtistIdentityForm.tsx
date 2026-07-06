"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@sonafrik/ui";
import type { ArtistProfile } from "@sonafrik/types";
import { GENRE_OPTIONS } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared";
import { useCreatorService } from "../hooks/useCreator";
import { useArtistProfileSrtspLive } from "../identity/hooks/useArtistProfileSrtspLive";

export function ArtistIdentityForm({
  profile: initialProfile,
  creatorId,
  userId,
}: {
  profile: ArtistProfile;
  creatorId: string;
  userId?: string;
}) {
  const creatorService = useCreatorService();
  const { data: liveProfile, refresh } = useArtistProfileSrtspLive({
    creatorId,
    userId,
    initialData: initialProfile,
  });

  const profile = liveProfile ?? initialProfile;
  const [stageName, setStageName] = useState(profile.stage_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [genres, setGenres] = useState<string[]>(profile.genres);
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStageName(profile.stage_name);
    setBio(profile.bio ?? "");
    setGenres(profile.genres);
    setIsPublic(profile.is_public);
  }, [profile]);

  function toggleGenre(genre: string) {
    setGenres((current) =>
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre].slice(0, 8),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await creatorService.updateArtistIdentity({
        stageName,
        bio: bio || null,
        genres,
        isPublic,
      });
      setMessage("Identité artiste enregistrée.");
      refresh();
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo & couverture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-texte-secondaire text-sm">
            Modifiez votre avatar et votre bannière depuis la vue d&apos;ensemble — recadrage et aperçu en direct.
          </p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/creator">Gérer photo et couverture</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil public</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-texte-secondaire text-sm">Nom de scène</span>
            <Input
              value={stageName}
              maxLength={FIELD_LIMITS.STAGE_NAME}
              onChange={(e) => setStageName(e.target.value)}
            />
            <div className="flex justify-end">
              <span
                className="text-xs"
                style={{ color: stageName.length > FIELD_LIMITS.STAGE_NAME * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
              >
                {stageName.length}/{FIELD_LIMITS.STAGE_NAME}
              </span>
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-texte-secondaire text-sm">Bio</span>
            <textarea
              value={bio}
              rows={4}
              maxLength={FIELD_LIMITS.ARTIST_BIO}
              onChange={(e) => setBio(e.target.value)}
              className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <span
                className="text-xs"
                style={{ color: bio.length > FIELD_LIMITS.ARTIST_BIO * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
              >
                {bio.length}/{FIELD_LIMITS.ARTIST_BIO}
              </span>
            </div>
          </label>
          <label className="flex items-center gap-2 text-sm text-texte-secondaire">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Profil public visible sur SONAFRIK
          </label>
          <div>
            <p className="text-texte-secondaire mb-2 text-sm">Genres</p>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    genres.includes(genre)
                      ? "border-vert-energie bg-vert-energie/10 text-vert-energie"
                      : "border-bordure text-texte-secondaire"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <p className={`text-sm ${message.includes("Erreur") ? "text-rouge-alerte" : "text-vert-energie"}`}>
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
