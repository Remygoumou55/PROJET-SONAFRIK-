"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

export interface CatalogCropResult {
  croppedBlob: Blob;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

interface CatalogCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  onSave: (result: CatalogCropResult) => Promise<void> | void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

async function getCroppedBlob(src: string, px: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = Math.max(1, Math.round(px.width));
      const h = Math.max(1, Math.round(px.height));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas_ctx_failed"));
        return;
      }
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-noir-profond").trim() || "rgb(13, 13, 13)";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(
        img,
        Math.round(px.x),
        Math.round(px.y),
        Math.round(px.width),
        Math.round(px.height),
        0,
        0,
        w,
        h,
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("blob_failed"))),
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
}

/** Crop modal catalog — indépendant du dashboard Hero. */
export function CatalogCropModal({
  open,
  onClose,
  imageSrc,
  title,
  onSave,
}: CatalogCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelArea, setPixelArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError(null);
    setPixelArea(null);
  }, [open, imageSrc]);

  const onCropAreaChange = useCallback((_area: Area, croppedAreaPixels: Area) => {
    setPixelArea(croppedAreaPixels);
  }, []);

  const stepZoom = (delta: number) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((z + delta).toFixed(2)))));

  async function handleSave() {
    if (!pixelArea) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, pixelArea);
      await onSave({ croppedBlob: blob, cropX: crop.x, cropY: crop.y, cropZoom: zoom });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du recadrage.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="crop-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="crop-modal__panel">
        <header className="crop-modal__header">
          <h2 className="crop-modal__title">{title}</h2>
          <button className="crop-modal__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className="crop-modal__body">
          <div className="crop-modal__left">
            <div className="crop-modal__crop-area">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropAreaChange={onCropAreaChange}
              />
            </div>
            <div className="crop-modal__zoom">
              <button type="button" className="crop-modal__zoom-step" onClick={() => stepZoom(-0.1)} aria-label="Zoom arrière">
                −
              </button>
              <input
                type="range"
                className="crop-modal__zoom-range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Niveau de zoom"
              />
              <button type="button" className="crop-modal__zoom-step" onClick={() => stepZoom(0.1)} aria-label="Zoom avant">
                +
              </button>
            </div>
            <p className="crop-modal__help-main">Déplacez et zoomez pour cadrer votre pochette carrée.</p>
          </div>
        </div>

        {error ? <p className="crop-modal__error" role="alert">{error}</p> : null}

        <footer className="crop-modal__footer">
          <button type="button" className="crop-modal__btn crop-modal__btn--cancel" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="crop-modal__btn crop-modal__btn--save" onClick={() => void handleSave()} disabled={saving || !pixelArea}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}
