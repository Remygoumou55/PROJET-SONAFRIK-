"use client";

import { useRef, useState } from "react";
import { Avatar, Button } from "@sonafrik/ui";
import { IMAGE_ACCEPT, IMAGE_POLICY, isImage, type ImageMime } from "@sonafrik/shared";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { useIdentityService } from "../hooks/useIdentity";

type AvatarMime = ImageMime;

interface AvatarUploadProps {
  displayName: string;
  initialUrl?: string | null;
  onUploaded?: (url: string) => void;
}

export function AvatarUpload({ displayName, initialUrl, onUploaded }: AvatarUploadProps) {
  const identity = useIdentityService();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation before any network call
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage(file.type) && !extOk) {
      setError("Format non autorisé. Utilisez JPEG, PNG ou WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > IMAGE_POLICY.maxBytes) {
      setError(`Image trop lourde. Maximum ${IMAGE_POLICY.maxLabel}.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Normalize MIME — if browser returns "" (drag-drop edge case) default to jpeg
    const contentType: AvatarMime = isImage(file.type) ? (file.type as AvatarMime) : "image/jpeg";

    setError(null);
    setLoading(true);

    try {
      const { signedUrl, token } = await identity.requestAvatarUploadUrl(contentType);

      await uploadAssetToSignedUrl(signedUrl, file, { contentType, token });

      const readUrl = await identity.getAvatarSignedUrl();
      if (readUrl) {
        setPreviewUrl(readUrl);
        onUploaded?.(readUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Impossible d'enregistrer votre photo. Réessayez.`);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <Avatar size="2xl" src={previewUrl ?? undefined} alt={displayName} fallback={displayName} />
      <div className="space-y-2 text-center sm:text-left">
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Téléversement…" : "Changer la photo"}
        </Button>
        <p className="text-texte-desactive text-xs">JPEG, PNG ou WebP · {IMAGE_POLICY.maxLabel} max · URL signée</p>
        {error ? <p className="text-rouge-alerte text-xs">{error}</p> : null}
      </div>
    </div>
  );
}
