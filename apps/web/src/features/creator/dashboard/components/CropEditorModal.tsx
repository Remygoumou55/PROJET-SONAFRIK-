"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CropResult {
  croppedBlob: Blob;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

interface CropEditorModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  aspect: number;
  initialCrop?: Point;
  initialZoom?: number;
  title: string;
  onSave: (result: CropResult) => Promise<void> | void;
}

// ─── Preview device tabs ─────────────────────────────────────────────────────

type PreviewDevice = "desktop" | "tablet" | "mobile";

const PREVIEW_DEVICES: { id: PreviewDevice; label: string; width: number }[] = [
  { id: "desktop", label: "Desktop", width: 440 },
  { id: "tablet",  label: "Tablet",  width: 300 },
  { id: "mobile",  label: "Mobile",  width: 180 },
];

// ─── Canvas crop helper ───────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas_ctx_failed")); return; }
      ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height,
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("blob_failed"));
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = imageSrc;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CropEditorModal({
  open,
  onClose,
  imageSrc,
  aspect,
  initialCrop,
  initialZoom,
  title,
  onSave,
}: CropEditorModalProps) {
  const [crop, setCrop] = useState<Point>(initialCrop ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom ?? 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handlePreview() {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      if (previewBlob) URL.revokeObjectURL(previewBlob);
      setPreviewBlob(URL.createObjectURL(blob));
    } catch {
      setError("Impossible de générer la prévisualisation.");
    }
  }

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      await onSave({ croppedBlob: blob, cropX: crop.x, cropY: crop.y, cropZoom: zoom });
      if (previewBlob) URL.revokeObjectURL(previewBlob);
      setPreviewBlob(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (previewBlob) URL.revokeObjectURL(previewBlob);
    setPreviewBlob(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="crop-modal__backdrop" onClick={handleClose} aria-hidden="true" />

      <div className="crop-modal__panel">
        {/* Header */}
        <div className="crop-modal__header">
          <h2 className="crop-modal__title">{title}</h2>
          <button
            className="crop-modal__close"
            onClick={handleClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="crop-modal__body">
          {/* Left: Crop area */}
          <div className="crop-modal__editor">
            <div className="crop-modal__crop-area">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
                style={{
                  containerStyle: { borderRadius: "0.75rem", background: "#0d0d0d" },
                  cropAreaStyle: {
                    border: "2px solid #00d26a",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                  },
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="crop-modal__zoom">
              <span className="crop-modal__zoom-label" aria-hidden="true">🔍</span>
              <input
                type="range"
                className="crop-modal__zoom-range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
              />
              <span className="crop-modal__zoom-value">{Math.round(zoom * 100)}%</span>
            </div>

            <p className="crop-modal__hint">
              Déplacez et zoomez pour choisir librement votre cadrage.
            </p>
          </div>

          {/* Right: Responsive preview */}
          <div className="crop-modal__preview-panel">
            <p className="crop-modal__preview-title">Prévisualisation</p>

            {/* Device tabs */}
            <div className="crop-modal__preview-tabs" role="tablist">
              {PREVIEW_DEVICES.map((d) => (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={previewDevice === d.id}
                  className={`crop-modal__preview-tab${previewDevice === d.id ? " crop-modal__preview-tab--active" : ""}`}
                  onClick={() => setPreviewDevice(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Preview frame */}
            <div className="crop-modal__preview-frame">
              {previewBlob ? (
                <div
                  className="crop-modal__preview-viewport"
                  style={{ maxWidth: PREVIEW_DEVICES.find((d) => d.id === previewDevice)?.width }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewBlob}
                    alt="Aperçu recadré"
                    className="crop-modal__preview-img"
                    style={{ aspectRatio: aspect === 1 ? "1/1" : "16/9" }}
                  />
                </div>
              ) : (
                <div className="crop-modal__preview-empty">
                  <p>Cliquez sur<br />« Prévisualiser »</p>
                </div>
              )}
            </div>

            <button
              className="crop-modal__preview-btn"
              onClick={() => void handlePreview()}
            >
              Prévisualiser
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="crop-modal__error" role="alert">{error}</p>
        )}

        {/* Footer */}
        <div className="crop-modal__footer">
          <button className="crop-modal__btn crop-modal__btn--cancel" onClick={handleClose}>
            Annuler
          </button>
          <button
            className="crop-modal__btn crop-modal__btn--save"
            disabled={saving || !croppedAreaPixels}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer le cadrage"}
          </button>
        </div>
      </div>
    </div>
  );
}
