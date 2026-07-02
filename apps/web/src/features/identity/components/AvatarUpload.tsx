"use client";

import { useRef, useState } from "react";
import { Avatar, Button } from "@sonafrik/ui";
import { useIdentityService } from "../hooks/useIdentity";

const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AvatarMime = (typeof AVATAR_ALLOWED_TYPES)[number];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

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
    if (!AVATAR_ALLOWED_TYPES.includes(file.type as AvatarMime) && !extOk) {
      setError("Format non autorisé. Utilisez JPEG, PNG ou WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("Image trop lourde. Maximum 5 Mo.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Normalize MIME — if browser returns "" (drag-drop edge case) default to jpeg
    const contentType: AvatarMime = AVATAR_ALLOWED_TYPES.includes(file.type as AvatarMime)
      ? (file.type as AvatarMime)
      : "image/jpeg";

    setError(null);
    setLoading(true);

    try {
      const { signedUrl, token } = await identity.requestAvatarUploadUrl(contentType);

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          ...(token ? { "x-upsert": "true" } : {}),
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("upload_failed");
      }

      const readUrl = await identity.getAvatarSignedUrl();
      if (readUrl) {
        setPreviewUrl(readUrl);
        onUploaded?.(readUrl);
      }
    } catch {
      setError("Échec du téléversement. Réessayez avec JPEG, PNG ou WebP (max 5 Mo).");
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
          accept="image/jpeg,image/png,image/webp"
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
        <p className="text-texte-desactive text-xs">JPEG, PNG ou WebP · 5 Mo max · URL signée</p>
        {error ? <p className="text-rouge-alerte text-xs">{error}</p> : null}
      </div>
    </div>
  );
}
