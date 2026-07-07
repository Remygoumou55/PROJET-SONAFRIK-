"use client";

import { memo, useCallback, useRef, useState } from "react";
import { CreatorAssetImage } from "./CreatorAssetImage";
import { useCreatorService } from "../../hooks/useCreator";
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { publishArtistProfileUpdate } from "@/features/creator/identity/lib/publishArtistProfileUpdate";
import { IMAGE_ACCEPT, IMAGE_POLICY, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";
import {
  compressImageFile,
  IMAGE_UPLOAD,
  isAllowedImageMime,
} from "@/lib/image/compress-image";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";

type AllowedImageMime = ImageMime;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ArtistCoverSliderProps {
  creatorId: string;
  stageName: string;
  primaryCoverPath: string | null;
  // kept in signature for API compat — unused (no re-crop flow)
  originalPath: string | null;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ArtistCoverSlider = memo(function ArtistCoverSlider({
  creatorId,
  stageName,
  primaryCoverPath,
}: ArtistCoverSliderProps) {
  const creatorService = useCreatorService();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localCoverPath, setLocalCoverPath] = useState(primaryCoverPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Upload direct — pas de popup de recadrage ───────────────────────────

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isAllowedImageMime(file.type) && !extOk) {
      setError("Format non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > IMAGE_POLICY.maxBytes) {
      setError(`Image trop lourde. Maximum ${IMAGE_POLICY.maxLabel}.`);
      return;
    }

    setUploading(true);
    try {
      // Compression pour bannière
      const compressed = await compressImageFile(file, {
        maxWidth: IMAGE_UPLOAD.COVER_MAX_PX,
        maxHeight: IMAGE_UPLOAD.COVER_MAX_PX,
      });
      const contentType: AllowedImageMime =
        resolveImageUploadMime(compressed) ?? "image/jpeg";

      // Upload unique — la même image sert de cover et d'original
      const { signedUrl, token, path } =
        await creatorService.requestAssetUploadUrl({
          creatorId,
          assetKind: "gallery",
          contentType,
        });
      await uploadAssetToSignedUrl(signedUrl, compressed, { contentType, token });

      // Sauvegarde en DB (pas de crop → valeurs neutres centrées)
      await creatorService.saveCoverPrimaryCrop({
        creatorId,
        croppedPath: path,
        originalPath: path,
        cropX: 0,
        cropY: 0,
        cropZoom: 1,
      });

      invalidateCreatorAssetUrl(creatorId);
      setLocalCoverPath(path);
      publishArtistProfileUpdate(creatorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setUploading(false);
    }
  }, [creatorId, creatorService]);

  return (
    <>
      {/* Cover — remplit 100 % du hero */}
      <div className="ahero__cover">
        {localCoverPath ? (
          <CreatorAssetImage
            creatorId={creatorId}
            path={localCoverPath}
            assetKind="gallery"
            alt={`Couverture ${stageName}`}
            fit="cover"
            layout="bounded"
            className="ahero__cover-img"
            priority
            fallback={<div className="ahero__cover-default" aria-hidden="true" />}
          />
        ) : (
          <div className="ahero__cover-default" aria-hidden="true" />
        )}

        {/* Gradient overlay pour la lisibilité du texte */}
        <div className="ahero__overlay" aria-hidden="true" />

        {uploading && (
          <div className="ahero__cover-loading" aria-live="polite">
            <span className="ahero__cover-spin">◌</span>
            <span className="ahero__cover-loading-hint">Enregistrement…</span>
          </div>
        )}
      </div>

      {/* Bouton couverture — coin supérieur droit */}
      <button
        className="ahero__btn ahero__btn--cover"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        aria-label="Changer la photo de couverture"
      >
        <span aria-hidden="true">🖼</span>
        {localCoverPath ? "Changer la couverture" : "Ajouter une couverture"}
      </button>

      {error && (
        <p className="ahero__cover-error" role="alert">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleFileSelect(e)}
      />
    </>
  );
});
