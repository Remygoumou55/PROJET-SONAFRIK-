"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

// ─── Public API (unchanged — no regression on callers) ────────────────────────

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

// ─── Device tabs ──────────────────────────────────────────────────────────────

type DeviceId = "desktop" | "tablet" | "mobile";

const DEVICES: { id: DeviceId; label: string; icon: string; maxPx: number }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥", maxPx: 320 },
  { id: "tablet",  label: "Tablet",  icon: "📱", maxPx: 220 },
  { id: "mobile",  label: "Mobile",  icon: "📲", maxPx: 140 },
];

// ─── Canvas crop (used only on save) ─────────────────────────────────────────

async function getCroppedBlob(src: string, px: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = px.width;
      canvas.height = px.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas_ctx_failed")); return; }
      ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
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

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [crop, setCrop]                   = useState<Point>(initialCrop ?? { x: 0, y: 0 });
  const [zoom, setZoom]                   = useState(initialZoom ?? 1);
  const [pixelArea, setPixelArea]         = useState<Area | null>(null);
  const [pctArea, setPctArea]             = useState<Area | null>(null); // for live preview
  const [activeDevice, setActiveDevice]   = useState<DeviceId>("desktop");
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Clear transient state every time the modal opens (guards stale error from prior session)
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setPctArea(croppedArea);
    setPixelArea(croppedAreaPixels);
  }, []);

  // ── Zoom helpers ───────────────────────────────────────────────────────────

  const stepZoom = (delta: number) =>
    setZoom((z) => Math.min(3, Math.max(1, parseFloat((z + delta).toFixed(2)))));

  // ── Real-time preview via CSS transform ────────────────────────────────────
  //
  // pctArea from react-easy-crop is expressed as % of the source image:
  //   pctArea.x/y = top-left corner of the crop region (% of image dimensions)
  //   pctArea.width/height = size of the crop region (% of image dimensions)
  //
  // To show this region filling a container:
  //   • image width  = (100 / pctArea.width) × 100% of container
  //   • image height = auto  (preserves natural aspect ratio)
  //   • translate(-pctArea.x%, -pctArea.y%) shifts the image by those %
  //     which is relative to the IMAGE element, correctly mapping to the crop.
  //
  const liveImgStyle = pctArea
    ? {
        position:        "absolute" as const,
        top:             0,
        left:            0,
        width:           `${(100 / pctArea.width) * 100}%`,
        height:          "auto",
        transform:       `translate(-${pctArea.x}%, -${pctArea.y}%)`,
        transformOrigin: "top left",
        userSelect:      "none" as const,
        pointerEvents:   "none" as const,
      }
    : { display: "none" as const };

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!pixelArea) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, pixelArea);
      await onSave({ croppedBlob: blob, cropX: crop.x, cropY: crop.y, cropZoom: zoom });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const aspectRatio = aspect === 1 ? "1 / 1" : "16 / 9";

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="crop-modal__backdrop" onClick={onClose} aria-hidden="true" />

      <div className="crop-modal__panel">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="crop-modal__header">
          <h2 className="crop-modal__title">{title}</h2>
          <button className="crop-modal__close" onClick={onClose} aria-label="Fermer">✕</button>
        </header>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="crop-modal__body">

          {/* LEFT — Crop editor */}
          <div className="crop-modal__left">

            {/* Crop canvas */}
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
                  containerStyle: {
                    borderRadius: "0.75rem",
                    background: "#0d0d0d",
                  },
                  cropAreaStyle: {
                    border: "2px solid var(--color-vert-energie, #00d26a)",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
                  },
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="crop-modal__zoom">
              <button
                className="crop-modal__zoom-step"
                onClick={() => stepZoom(-0.1)}
                aria-label="Réduire le zoom"
                tabIndex={0}
              >
                −
              </button>
              <input
                type="range"
                className="crop-modal__zoom-range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Niveau de zoom"
              />
              <button
                className="crop-modal__zoom-step"
                onClick={() => stepZoom(0.1)}
                aria-label="Augmenter le zoom"
                tabIndex={0}
              >
                +
              </button>
              <span className="crop-modal__zoom-value" aria-live="polite">
                {Math.round(zoom * 100)} %
              </span>
            </div>

            {/* Help text */}
            <div className="crop-modal__help">
              <p className="crop-modal__help-main">
                Déplacez et zoomez votre image. Le résultat sera enregistré exactement comme affiché.
              </p>
              <p className="crop-modal__help-note">
                ✔ Le cadrage sera conservé sur Desktop, Tablet et Mobile.
              </p>
            </div>
          </div>

          {/* RIGHT — Live preview */}
          <div className="crop-modal__right">
            <p className="crop-modal__preview-title">Aperçu en direct</p>

            {/* Device tabs */}
            <div className="crop-modal__tabs" role="tablist" aria-label="Format d'aperçu">
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={activeDevice === d.id}
                  className={`crop-modal__tab${activeDevice === d.id ? " crop-modal__tab--active" : ""}`}
                  onClick={() => setActiveDevice(d.id)}
                >
                  <span className="crop-modal__tab-icon" aria-hidden="true">{d.icon}</span>
                  <span className="crop-modal__tab-label">{d.label}</span>
                </button>
              ))}
            </div>

            {/* Preview panels — all rendered, only active is visible */}
            <div className="crop-modal__previews">
              {DEVICES.map((d) => (
                <div
                  key={d.id}
                  role="tabpanel"
                  aria-hidden={activeDevice !== d.id}
                  className={`crop-modal__preview${activeDevice === d.id ? " crop-modal__preview--active" : ""}`}
                >
                  {/* Clip window — enforces crop aspect ratio */}
                  <div
                    className="crop-modal__clip"
                    style={{ aspectRatio, maxWidth: d.maxPx }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      crossOrigin="anonymous"
                      className="crop-modal__live-img"
                      style={liveImgStyle}
                    />
                    {!pctArea && (
                      <span className="crop-modal__clip-placeholder">
                        Bougez l&apos;image pour voir l&apos;aperçu
                      </span>
                    )}
                  </div>
                  <p className="crop-modal__device-hint">{d.label} · {d.maxPx} px</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && <p className="crop-modal__error" role="alert">{error}</p>}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="crop-modal__footer">
          <button className="crop-modal__btn crop-modal__btn--cancel" onClick={onClose}>
            Annuler
          </button>
          <button
            className="crop-modal__btn crop-modal__btn--save"
            disabled={saving || !pixelArea}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer le cadrage"}
          </button>
        </footer>
      </div>
    </div>
  );
}
