"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useRef, useState } from "react";
import { CreatorAssetImage } from "./CreatorAssetImage";
import type { CropResult } from "./CropEditorModal";
import { useCreatorAssetUrl } from "../hooks/useCreatorAssetUrl";
import { useCreatorService } from "../../hooks/useCreator";
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { publishArtistProfileUpdate } from "@/features/creator/identity/lib/publishArtistProfileUpdate";
import { IMAGE_ACCEPT, IMAGE_POLICY, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";

const CropEditorModal = dynamic(
  () => import("./CropEditorModal").then((m) => ({ default: m.CropEditorModal })),
  { ssr: false },
);
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
  // Primary cover (first of cover_images or banner_path)
  primaryCoverPath: string | null;
  // Crop persistence
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
  originalPath,
  cropX,
  cropY,
  cropZoom,
}: ArtistCoverSliderProps) {
  const creatorService = useCreatorService();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localCoverPath, setLocalCoverPath] = useState(primaryCoverPath);
  const [localOriginalPath, setLocalOriginalPath] = useState(originalPath);
  const [localCropX, setLocalCropX] = useState(cropX);
  const [localCropY, setLocalCropY] = useState(cropY);
  const [localCropZoom, setLocalCropZoom] = useState(cropZoom);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingOriginalFile, setPendingOriginalFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed URL for re-crop (original stored in gallery)
  const { url: originalSignedUrl } = useCreatorAssetUrl(
    creatorId,
    localOriginalPath,
    "gallery",
  );

  // ── Open crop editor ────────────────────────────────────────────────────

  const openCropEditor = useCallback(() => {
    setError(null);
    if (localOriginalPath && originalSignedUrl) {
      setCropSrc(originalSignedUrl);
      setCropOpen(true);
      return;
    }
    fileInputRef.current?.click();
  }, [localOriginalPath, originalSignedUrl]);

  // ── Handle new file ─────────────────────────────────────────────────────

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

    setIsProcessing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: IMAGE_UPLOAD.COVER_MAX_PX,
        maxHeight: IMAGE_UPLOAD.COVER_MAX_PX,
      });
      setPendingOriginalFile(compressed);
      setCropSrc(URL.createObjectURL(compressed));
      setCropOpen(true);
    } catch {
      setError("Impossible de traiter cette image.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ── Save crop result ────────────────────────────────────────────────────

  const handleCropSave = useCallback(async (result: CropResult) => {
    setLoading(true);
    setError(null);
    try {
      const croppedFile = new File([result.croppedBlob], "cover.jpg", { type: "image/jpeg" });

      let finalOriginalPath = localOriginalPath;

      // Upload original (only for new files)
      if (pendingOriginalFile) {
        const origContentType: AllowedImageMime =
          resolveImageUploadMime(pendingOriginalFile) ?? "image/jpeg";
        const { signedUrl: origSignedUrl, token: origToken, path: origPath } =
          await creatorService.requestAssetUploadUrl({
            creatorId,
            assetKind: "gallery",
            contentType: origContentType,
          });
        await uploadAssetToSignedUrl(origSignedUrl, pendingOriginalFile, {
          contentType: origContentType,
          token: origToken,
        });
        finalOriginalPath = origPath;
      }

      // Upload cropped cover
      const { signedUrl: cropSignedUrl, token: cropToken, path: croppedPath } =
        await creatorService.requestAssetUploadUrl({
          creatorId,
          assetKind: "gallery",
          contentType: "image/jpeg",
        });
      await uploadAssetToSignedUrl(cropSignedUrl, croppedFile, {
        contentType: "image/jpeg",
        token: cropToken,
      });

      // Save to DB
      await creatorService.saveCoverPrimaryCrop({
        creatorId,
        croppedPath,
        originalPath: finalOriginalPath ?? croppedPath,
        cropX: result.cropX,
        cropY: result.cropY,
        cropZoom: result.cropZoom,
      });

      invalidateCreatorAssetUrl(creatorId);
      setLocalCoverPath(croppedPath);
      setLocalOriginalPath(finalOriginalPath ?? croppedPath);
      setLocalCropX(result.cropX);
      setLocalCropY(result.cropY);
      setLocalCropZoom(result.cropZoom);
      setPendingOriginalFile(null);
      if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      publishArtistProfileUpdate(creatorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [creatorId, localOriginalPath, pendingOriginalFile, cropSrc, creatorService]);

  return (
    <>
      {/* Cover fill */}
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

        {/* Gradient overlay */}
        <div className="ahero__overlay" aria-hidden="true" />

        {/* Loading / processing indicator */}
        {(loading || isProcessing) && (
          <div className="ahero__cover-loading" aria-live="polite">
            <span className="ahero__cover-spin">◌</span>
            {isProcessing && (
              <span className="ahero__cover-loading-hint">Analyse de l&apos;image…</span>
            )}
          </div>
        )}
      </div>

      {/* "Gérer la couverture" button */}
      <button
        className="ahero__btn ahero__btn--cover"
        onClick={openCropEditor}
        disabled={loading || isProcessing}
        aria-label="Gérer la couverture"
      >
        🖼 Gérer la couverture
      </button>

      {error && <p className="ahero__cover-error" role="alert">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleFileSelect(e)}
      />

      {/* Crop editor */}
      {cropSrc && (
        <CropEditorModal
          key={cropSrc}
          open={cropOpen}
          onClose={() => {
            if (cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
            setPendingOriginalFile(null);
            setCropOpen(false);
          }}
          imageSrc={cropSrc}
          aspect={16 / 9}
          // New image: no saved crop → undefined triggers auto-fit + "new image" messaging
          // Re-crop: restore saved position/zoom
          initialCrop={pendingOriginalFile ? undefined : { x: localCropX, y: localCropY }}
          initialZoom={pendingOriginalFile ? undefined : localCropZoom}
          title="Recadrer la couverture"
          onSave={handleCropSave}
          onChangePhoto={() => fileInputRef.current?.click()}
        />
      )}
    </>
  );
});
