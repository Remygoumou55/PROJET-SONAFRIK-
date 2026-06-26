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
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal } from "@sonafrik/ui";
import { CreatorAssetImage } from "./CreatorAssetImage";

interface ArtistCoverManagerProps {
  creatorId: string;
  stageName: string;
  coverImages: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImagesChange?: () => void;
}

export function ArtistCoverManager({
  creatorId,
  stageName,
  coverImages,
  open,
  onOpenChange,
  onImagesChange,
}: ArtistCoverManagerProps) {
  const creatorService = useCreatorService();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState(coverImages);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(coverImages);
  }, [coverImages]);

  const resetPreview = useCallback(() => {
    if (previewUrl) revokeImagePreviewUrl(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
  }, [previewUrl]);

  async function persistGallery(next: string[]) {
    await creatorService.updateCoverGallery({ creatorId, coverImages: next });
    invalidateCreatorAssetUrl(creatorId);
    setItems(next);
    onImagesChange?.();
    router.refresh();
  }

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
        maxWidth: IMAGE_UPLOAD.COVER_MAX_PX,
        maxHeight: Math.round(IMAGE_UPLOAD.COVER_MAX_PX / (16 / 9)),
        crop: "cover",
      });
      resetPreview();
      setPendingFile(compressed);
      setPreviewUrl(createImagePreviewUrl(compressed));
      setPreviewOpen(true);
    } catch {
      setError("Impossible de traiter cette image.");
    }
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    if (items.length >= IMAGE_UPLOAD.MAX_GALLERY_ITEMS) {
      setError(`Maximum ${IMAGE_UPLOAD.MAX_GALLERY_ITEMS} images.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const contentType = pendingFile.type as AllowedImageMime;
      const { signedUrl, token, path } = await creatorService.requestAssetUploadUrl({
        creatorId,
        assetKind: "gallery",
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
      await persistGallery([...items, path]);
      setPreviewOpen(false);
      resetPreview();
    } catch {
      setError("Échec du téléversement.");
    } finally {
      setLoading(false);
    }
  }

  async function removeAt(index: number) {
    const next = items.filter((_, i) => i !== index);
    setLoading(true);
    try {
      await persistGallery(next);
    } catch {
      setError("Impossible de supprimer cette image.");
    } finally {
      setLoading(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    setLoading(true);
    try {
      await persistGallery(next);
    } catch {
      setError("Impossible de réorganiser.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Photos de couverture"
        description="Ajoutez, réorganisez ou supprimez vos visuels de couverture."
        size="lg"
        footer={
          <Button type="button" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
            Ajouter une image
          </Button>
        }
      >
        {error ? <p className="artist-hero__photo-error">{error}</p> : null}
        <ul className="artist-hero__gallery-list">
          {items.length === 0 ? (
            <li className="artist-hero__gallery-empty">Aucune couverture — ajoutez votre première image.</li>
          ) : (
            items.map((path, index) => (
              <li key={path} className="artist-hero__gallery-item">
                <div className="artist-hero__gallery-thumb">
                  <CreatorAssetImage
                    creatorId={creatorId}
                    path={path}
                    assetKind="gallery"
                    alt={`Couverture ${index + 1}`}
                    sizes="120px"
                  />
                </div>
                <div className="artist-hero__gallery-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || index === 0}
                    onClick={() => void move(index, -1)}
                    aria-label="Monter"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || index === items.length - 1}
                    onClick={() => void move(index, 1)}
                    aria-label="Descendre"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => void removeAt(index)}
                  >
                    Supprimer
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void prepareFile(file);
            e.target.value = "";
          }}
        />
      </Modal>

      <Modal
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) resetPreview();
        }}
        title="Prévisualiser la couverture"
        description={`Recadrage 16:9 pour ${stageName}.`}
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Annuler
            </Button>
            <Button type="button" size="sm" disabled={loading || !pendingFile} onClick={() => void confirmUpload()}>
              {loading ? "Envoi…" : "Valider"}
            </Button>
          </>
        }
      >
        {previewUrl ? (
          <div className="artist-hero__preview-frame artist-hero__preview-frame--cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Aperçu couverture" className="artist-hero__preview-img" />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
