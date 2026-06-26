"use client";

import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
import {
  compressImageFile,
  createImagePreviewUrl,
  IMAGE_UPLOAD,
  isAllowedImageMime,
  revokeImagePreviewUrl,
  type AllowedImageMime,
} from "@/lib/image/compress-image";
import { useCreatorService } from "../../hooks/useCreator";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button, Dropdown, Modal } from "@sonafrik/ui";
import { CreatorAssetImage } from "./CreatorAssetImage";

interface ArtistProfilePhotoProps {
  creatorId: string;
  stageName: string;
  photoPath: string | null;
}

export function ArtistProfilePhoto({ creatorId, stageName, photoPath }: ArtistProfilePhotoProps) {
  const creatorService = useCreatorService();
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [localPath, setLocalPath] = useState(photoPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = stageName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const resetPreview = useCallback(() => {
    if (previewUrl) revokeImagePreviewUrl(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
  }, [previewUrl]);

  async function prepareFile(file: File) {
    setError(null);
    if (!isAllowedImageMime(file.type)) {
      setError("Format non autorisé. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > IMAGE_UPLOAD.MAX_BYTES) {
      setError("Image trop lourde. Maximum 5 Mo.");
      return;
    }
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: IMAGE_UPLOAD.PROFILE_MAX_PX,
        maxHeight: IMAGE_UPLOAD.PROFILE_MAX_PX,
        crop: "square",
      });
      resetPreview();
      const url = createImagePreviewUrl(compressed);
      setPendingFile(compressed);
      setPreviewUrl(url);
      setModalOpen(true);
    } catch {
      setError("Impossible de traiter cette image.");
    }
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setLoading(true);
    setError(null);
    try {
      const contentType = pendingFile.type as AllowedImageMime;
      const { signedUrl, token, path } = await creatorService.requestAssetUploadUrl({
        creatorId,
        assetKind: "cover",
        contentType,
      });
      const res = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          ...(token ? { "x-upsert": "true" } : {}),
        },
        body: pendingFile,
      });
      if (!res.ok) throw new Error("upload_failed");
      invalidateCreatorAssetUrl(creatorId);
      setLocalPath(path);
      setModalOpen(false);
      resetPreview();
      router.refresh();
    } catch {
      setError("Échec du téléversement. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      await creatorService.removeProfilePhoto(creatorId);
      invalidateCreatorAssetUrl(creatorId);
      setLocalPath(null);
      router.refresh();
    } catch {
      setError("Impossible de supprimer la photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dropdown
        label="Menu photo de profil"
        align="start"
        trigger={
          <button
            type="button"
            className="artist-hero__avatar-btn"
            aria-label="Gérer la photo de profil"
            disabled={loading}
          >
            <div className="artist-hero__avatar">
              {localPath ? (
                <CreatorAssetImage
                  creatorId={creatorId}
                  path={localPath}
                  assetKind="cover"
                  alt={stageName}
                  sizes="96px"
                  priority
                  fallback={<span className="artist-hero__avatar-fallback">{initials || "🎤"}</span>}
                />
              ) : (
                <span className="artist-hero__avatar-fallback" aria-hidden="true">
                  {initials || "🎤"}
                </span>
              )}
              <span className="artist-hero__avatar-overlay" aria-hidden="true">
                Modifier
              </span>
            </div>
          </button>
        }
        items={[
          {
            label: "Modifier la photo",
            onSelect: () => uploadInputRef.current?.click(),
          },
          {
            label: "Choisir depuis la galerie",
            onSelect: () => galleryInputRef.current?.click(),
          },
          {
            label: "Prendre une photo",
            onSelect: () => cameraInputRef.current?.click(),
          },
          {
            label: "Supprimer",
            destructive: true,
            disabled: !localPath,
            onSelect: () => void handleRemove(),
          },
        ]}
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void prepareFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void prepareFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void prepareFile(file);
          e.target.value = "";
        }}
      />

      {error ? <p className="artist-hero__photo-error">{error}</p> : null}

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetPreview();
        }}
        title="Prévisualiser la photo"
        description="Recadrage carré automatique. Validez pour enregistrer."
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="button" size="sm" disabled={loading || !pendingFile} onClick={() => void confirmUpload()}>
              {loading ? "Envoi…" : "Valider"}
            </Button>
          </>
        }
      >
        {previewUrl ? (
          <div className="artist-hero__preview-frame artist-hero__preview-frame--square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Aperçu photo de profil" className="artist-hero__preview-img" />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
