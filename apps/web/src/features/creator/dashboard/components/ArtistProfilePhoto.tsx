"use client";

import { useCallback, useRef, useState } from "react";
import { IMAGE_ACCEPT, IMAGE_POLICY, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";
import {
  compressImageFile,
  IMAGE_UPLOAD,
  isAllowedImageMime,
} from "@/lib/image/compress-image";
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import { useCreatorService } from "../../hooks/useCreator";
import { useCreatorAssetUrl } from "../hooks/useCreatorAssetUrl";
import { useRouter } from "next/navigation";
import { CreatorAssetImage } from "./CreatorAssetImage";
import { CropEditorModal } from "./CropEditorModal";
import type { CropResult } from "./CropEditorModal";

type AllowedImageMime = ImageMime;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ArtistProfilePhotoProps {
  creatorId: string;
  stageName: string;
  photoPath: string | null;
  // Crop persistence fields from artistProfile
  originalPath: string | null;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArtistProfilePhoto({
  creatorId,
  stageName,
  photoPath,
  originalPath,
  cropX,
  cropY,
  cropZoom,
}: ArtistProfilePhotoProps) {
  const creatorService = useCreatorService();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localPhotoPath, setLocalPhotoPath] = useState(photoPath);
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

  // Fetch signed URL for the stored original (for re-crop without re-upload)
  const { url: originalSignedUrl } = useCreatorAssetUrl(
    creatorId,
    localOriginalPath,
    "gallery",
  );

  const initials = stageName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // ── Open crop editor ──────────────────────────────────────────────────────

  const openCropEditor = useCallback(async () => {
    setError(null);

    // Re-crop saved original: no file picker needed
    if (localOriginalPath && originalSignedUrl) {
      setCropSrc(originalSignedUrl);
      setCropOpen(true);
      return;
    }

    // No original saved: trigger file picker
    fileInputRef.current?.click();
  }, [localOriginalPath, originalSignedUrl]);

  // ── Handle new file selection ─────────────────────────────────────────────

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isAllowedImageMime(file.type) && !extOk) {
      setError("Format non autorisé. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > IMAGE_POLICY.maxBytes) {
      setError(`Image trop lourde. Maximum ${IMAGE_POLICY.maxLabel}.`);
      return;
    }

    setIsProcessing(true);
    try {
      // Compress without crop — preserve original proportions for the crop editor
      const compressed = await compressImageFile(file, {
        maxWidth: IMAGE_UPLOAD.PROFILE_MAX_PX * 2,
        maxHeight: IMAGE_UPLOAD.PROFILE_MAX_PX * 2,
      });
      setPendingOriginalFile(compressed);
      const objectUrl = URL.createObjectURL(compressed);
      setCropSrc(objectUrl);
      setCropOpen(true);
    } catch {
      setError("Impossible de traiter cette image.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ── Save crop result ──────────────────────────────────────────────────────

  const handleCropSave = useCallback(async (result: CropResult) => {
    setLoading(true);
    setError(null);
    try {
      const croppedFile = new File([result.croppedBlob], "avatar.jpg", { type: "image/jpeg" });

      let finalOriginalPath = localOriginalPath;

      // Upload original (only when a new file was selected)
      if (pendingOriginalFile) {
        const origContentType: AllowedImageMime =
          resolveImageUploadMime(pendingOriginalFile) ?? "image/jpeg";
        const { signedUrl: origSignedUrl, token: origToken, path: origPath } =
          await creatorService.requestAssetUploadUrl({
            creatorId,
            assetKind: "gallery",
            contentType: origContentType,
          });
        const origRes = await fetch(origSignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": origContentType,
            ...(origToken ? { "x-upsert": "true" } : {}),
          },
          body: pendingOriginalFile,
        });
        if (!origRes.ok) throw new Error("Échec de l'envoi de l'original.");
        finalOriginalPath = origPath;
      }

      // Upload cropped avatar (gallery = pas de pollution cover_path via edge fn)
      const { signedUrl: cropSignedUrl, token: cropToken, path: croppedPath } =
        await creatorService.requestAssetUploadUrl({
          creatorId,
          assetKind: "gallery",
          contentType: "image/jpeg",
        });
      const cropRes = await fetch(cropSignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
          ...(cropToken ? { "x-upsert": "true" } : {}),
        },
        body: croppedFile,
      });
      if (!cropRes.ok) throw new Error("Échec de l'envoi du recadrage.");

      // Save to DB
      await creatorService.saveAvatarCrop({
        creatorId,
        croppedPath,
        originalPath: finalOriginalPath ?? croppedPath,
        cropX: result.cropX,
        cropY: result.cropY,
        cropZoom: result.cropZoom,
      });

      invalidateCreatorAssetUrl(creatorId);
      setLocalPhotoPath(croppedPath);
      setLocalOriginalPath(finalOriginalPath ?? croppedPath);
      setLocalCropX(result.cropX);
      setLocalCropY(result.cropY);
      setLocalCropZoom(result.cropZoom);
      setPendingOriginalFile(null);
      if (cropSrc && cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement. Réessayez.");
      throw err; // let CropEditorModal keep showing error
    } finally {
      setLoading(false);
    }
  }, [creatorId, localOriginalPath, pendingOriginalFile, cropSrc, creatorService, router]);

  const handleRemove = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await creatorService.removeProfilePhoto(creatorId);
      invalidateCreatorAssetUrl(creatorId);
      setLocalPhotoPath(null);
      setLocalOriginalPath(null);
      router.refresh();
    } catch {
      setError("Impossible de supprimer la photo.");
    } finally {
      setLoading(false);
    }
  }, [creatorId, creatorService, router]);

  return (
    <>
      {/* Avatar display */}
      <div className="ahero__avatar-wrap">
        <div className="ahero__avatar">
          {localPhotoPath ? (
            <CreatorAssetImage
              creatorId={creatorId}
              path={localPhotoPath}
              assetKind="gallery"
              alt={stageName}
              layout="bounded"
              priority
              fallback={
                <span className="ahero__avatar-initials" aria-hidden="true">
                  {initials || "🎤"}
                </span>
              }
            />
          ) : (
            <span className="ahero__avatar-initials" aria-hidden="true">
              {initials || "🎤"}
            </span>
          )}
          {(loading || isProcessing) && (
            <div className="ahero__avatar-loading" aria-live="polite">
              <span>◌</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="ahero__avatar-actions">
        <button
          className="ahero__btn"
          onClick={() => void openCropEditor()}
          disabled={loading || isProcessing}
          aria-label="Gérer la photo de profil"
        >
          📷 Gérer l&apos;avatar
        </button>
        {localPhotoPath && (
          <button
            className="ahero__btn ahero__btn--danger"
            onClick={() => void handleRemove()}
            disabled={loading}
            aria-label="Supprimer la photo de profil"
          >
            🗑
          </button>
        )}
      </div>

      {error && (
        <p className="ahero__photo-error" role="alert">{error}</p>
      )}

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

      {/* Crop editor modal */}
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
          aspect={1}
          // New image: pass undefined → auto-fit + "new image" messaging
          // Re-crop: restore saved position/zoom
          initialCrop={pendingOriginalFile ? undefined : { x: localCropX, y: localCropY }}
          initialZoom={pendingOriginalFile ? undefined : localCropZoom}
          title="Recadrer l'avatar"
          onSave={handleCropSave}
          onChangePhoto={() => fileInputRef.current?.click()}
        />
      )}
    </>
  );
}
