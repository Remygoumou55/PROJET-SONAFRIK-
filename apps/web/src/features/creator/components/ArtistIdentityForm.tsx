"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@sonafrik/ui";
import type { ArtistProfile, Creator } from "@sonafrik/types";
import { GENRE_OPTIONS } from "@sonafrik/types";
import { FIELD_LIMITS, IMAGE_ACCEPT, IMAGE_POLICY, isImage, resolveImageUploadMime } from "@sonafrik/shared";
import { useCreatorService } from "../hooks/useCreator";

export function ArtistIdentityForm({
  creator,
  profile,
}: {
  creator: Creator;
  profile: ArtistProfile;
}) {
  const router = useRouter();
  const creatorService = useCreatorService();
  const bannerRef = useRef<HTMLInputElement>(null);
  const [stageName, setStageName] = useState(profile.stage_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [genres, setGenres] = useState<string[]>(profile.genres);
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleGenre(genre: string) {
    setGenres((current) =>
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre].slice(0, 8),
    );
  }

  async function uploadBanner(file: File) {
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage(file.type) && !extOk) {
      throw new Error("Format non autorisé. Utilisez JPEG, PNG ou WebP.");
    }
    if (file.size > IMAGE_POLICY.maxBytes) {
      throw new Error(`Image trop lourde. Maximum ${IMAGE_POLICY.maxLabel}.`);
    }
    const contentType = resolveImageUploadMime(file) ?? "image/jpeg";
    const { signedUrl, token } = await creatorService.requestAssetUploadUrl({
      creatorId: creator.id,
      assetKind: "banner",
      contentType,
    });
    const res = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, ...(token ? { "x-upsert": "true" } : {}) },
      body: file,
    });
    if (!res.ok) throw new Error(`Erreur envoi bannière (${res.status}).`);
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
      router.refresh();
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
          <CardTitle>Bannière artiste</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={bannerRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setLoading(true);
              setMessage(null);
              try {
                await uploadBanner(file);
                router.refresh();
                setMessage("Bannière mise à jour.");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Erreur lors de l'envoi de la bannière.");
              } finally {
                setLoading(false);
                event.target.value = "";
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => bannerRef.current?.click()}>
            Téléverser bannière (URL signée)
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
