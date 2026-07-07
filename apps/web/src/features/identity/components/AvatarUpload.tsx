"use client";

import { useCallback, useState } from "react";
import { Avatar, Button } from "@sonafrik/ui";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { useIdentityService } from "../hooks/useIdentity";
import {
  AUTO_IMAGE_VARIANTS,
  type AutoImagePrepared,
} from "@/features/shared/media/autoImagePipeline";
import { useAutoImageUpload } from "@/features/shared/media/useAutoImageUpload";

interface AvatarUploadProps {
  displayName: string;
  initialUrl?: string | null;
  onUploaded?: (url: string) => void;
}

export function AvatarUpload({ displayName, initialUrl, onUploaded }: AvatarUploadProps) {
  const identity = useIdentityService();
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);

  const handleUpload = useCallback(async (prepared: AutoImagePrepared) => {
    try {
      const { signedUrl, token } = await identity.requestAvatarUploadUrl(prepared.contentType);
      await uploadAssetToSignedUrl(signedUrl, prepared.file, {
        contentType: prepared.contentType,
        token,
      });

      const readUrl = await identity.getAvatarSignedUrl();
      if (readUrl) {
        setPreviewUrl(readUrl);
        onUploaded?.(readUrl);
      }
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer votre photo. Réessayez.",
      );
    }
  }, [identity, onUploaded]);

  const {
    inputRef,
    uploading,
    error,
    accept,
    openFilePicker,
    handleInputChange,
  } = useAutoImageUpload({
    variant: AUTO_IMAGE_VARIANTS.avatar,
    onUpload: handleUpload,
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <Avatar size="2xl" src={previewUrl ?? undefined} alt={displayName} fallback={displayName} />
      <div className="space-y-2 text-center sm:text-left">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => void handleInputChange(event)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={openFilePicker}
        >
          {uploading ? "Téléversement…" : "Changer la photo"}
        </Button>
        <p className="text-texte-desactive text-xs">JPEG, PNG ou WebP · optimisation automatique · URL signée</p>
        {error ? <p className="text-rouge-alerte text-xs">{error}</p> : null}
      </div>
    </div>
  );
}
