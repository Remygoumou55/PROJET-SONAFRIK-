"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  onChangePhoto?: () => void;
}

// ─── Device tabs ──────────────────────────────────────────────────────────────

type DeviceId = "desktop" | "tablet" | "mobile";

const DEVICES: { id: DeviceId; label: string; icon: string; maxPx: number }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥", maxPx: 260 },
  { id: "tablet",  label: "Tablet",  icon: "📱", maxPx: 180 },
  { id: "mobile",  label: "Mobile",  icon: "📲", maxPx: 120 },
];

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

// ─── Canvas crop (used only on save) ─────────────────────────────────────────

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
      if (!ctx) { reject(new Error("canvas_ctx_failed")); return; }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(
        img,
        Math.round(px.x), Math.round(px.y),
        Math.round(px.width), Math.round(px.height),
        0, 0, w, h,
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
  onChangePhoto,
}: CropEditorModalProps) {
  const [crop, setCrop]                 = useState<Point>(initialCrop ?? { x: 0, y: 0 });
  const [zoom, setZoom]                 = useState(initialZoom ?? 1);
  const [pixelArea, setPixelArea]       = useState<Area | null>(null);
  const [pctArea, setPctArea]           = useState<Area | null>(null); // for live preview
  const [activeDevice, setActiveDevice] = useState<DeviceId>("desktop");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [wasReset, setWasReset]         = useState(false);
  const [imgInfo, setImgInfo]           = useState<{ w: number; h: number } | null>(null);
  // fitZoom: auto-calculated when no initialZoom is provided (new image)
  const [fitZoom, setFitZoom]           = useState(1);

  // Sync crop/zoom to initial values each time the modal opens.
  // Intentionally NOT including initialCrop/initialZoom in deps — they're treated
  // as one-shot config at open time (parent may pass new object refs each render).
  // pctArea/pixelArea are NOT cleared here: Cropper fires onCropAreaChange on mount,
  // which updates them promptly — clearing them would cause a preview flash.
  useEffect(() => {
    if (!open) return;
    setCrop(initialCrop ?? { x: 0, y: 0 });
    setZoom(initialZoom ?? 1);
    setFitZoom(1);
    setError(null);
    setWasReset(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Read natural image dimensions + calculate auto-fit zoom for new images
  useEffect(() => {
    if (!open || !imageSrc) { setImgInfo(null); return; }
    const img = new Image();
    img.onload = () => {
      const info = { w: img.naturalWidth, h: img.naturalHeight };
      setImgInfo(info);
      // Auto-fit zoom: only for new images (no saved initialZoom)
      if (initialZoom === undefined) {
        const imgAspect = info.w / info.h;
        const ratio = Math.min(imgAspect, aspect) / Math.max(imgAspect, aspect);
        // When aspect mismatch > 1.8× (portrait in landscape or vice versa): zoom to fit
        const computed = ratio < 1 / 1.8 ? Math.max(MIN_ZOOM, ratio * 1.15) : 1;
        setFitZoom(computed);
        setZoom(computed);
      }
    };
    img.onerror = () => setImgInfo(null);
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageSrc]);

  // onCropAreaChange fires on EVERY crop/zoom change (including during drag).
  // onCropComplete fires only at interaction end — too late for real-time preview.
  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setPctArea(croppedArea);
    setPixelArea(croppedAreaPixels);
  }, []);

  // ── Zoom helpers ───────────────────────────────────────────────────────────

  const stepZoom = (delta: number) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((z + delta).toFixed(2)))));

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setCrop(initialCrop ?? { x: 0, y: 0 });
    // For new images: reset to auto-fit zoom; for re-crops: reset to saved zoom
    setZoom(initialZoom ?? fitZoom);
    setWasReset(true);
  };

  // ── Safe-zone geometry (for 16:9 crop in 4:3 container) ───────────────────
  //
  // In a 4:3 container with a 16:9 crop indicator:
  //   crop frame height = 75% of container height, centered (top = 12.5%)
  // The content band (avatar + info + stats) occupies the bottom ~45% of frame.
  //
  const safeZone = useMemo(() => {
    if (aspect === 1) return null; // avatar crops don't need a safe zone
    const cH   = 75;    // crop frame height, % of container
    const cTop = 12.5;  // crop frame top offset, % of container
    return {
      band: {
        top:    cTop + cH * 0.55,
        height: cH * 0.45,
      },
      avatar: {
        top:    cTop + cH * 0.72,
        height: cH * 0.28,
        width:  17,
      },
      labelTop: cTop + cH * 0.57,
    };
  }, [aspect]);

  // ── Real-time preview via CSS transform ────────────────────────────────────
  //
  // pctArea from react-easy-crop (first arg of onCropComplete) is % of source image:
  //   x/y = top-left of crop region  •  width/height = size of crop region
  //
  // To display the cropped region filling a container:
  //   image width  = (100 / pctArea.width) × 100%  (scales so crop = 100% of container)
  //   image height = auto  (preserves natural aspect — critical, do not set to %)
  //   translate = (-pctArea.x%, -pctArea.y%)  (% relative to image element = correct offset)
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const aspectRatio = aspect === 1 ? "1 / 1" : "16 / 9";
  const isCover     = aspect !== 1;

  const helpText = wasReset
    ? "Cadrage réinitialisé. Affinez si besoin puis enregistrez."
    : initialCrop
    ? "Recadrez selon vos préférences. Le résultat est affiché en temps réel."
    : "Déplacez et zoomez votre image. Le résultat sera enregistré exactement comme affiché.";

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="crop-modal__backdrop" onClick={onClose} aria-hidden="true" />

      <div className="crop-modal__panel">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="crop-modal__header">
          <h2 className="crop-modal__title">{title}</h2>
          <div className="crop-modal__header-actions">
            {isCover && (
              <button
                className={`crop-modal__safe-toggle${showSafeZone ? " crop-modal__safe-toggle--on" : ""}`}
                onClick={() => setShowSafeZone((v) => !v)}
                aria-pressed={showSafeZone}
                title="Afficher où le contenu (avatar, texte, stats) apparaîtra sur la cover"
              >
                ⊙ Zones
              </button>
            )}
            <button className="crop-modal__close" onClick={onClose} aria-label="Fermer">✕</button>
          </div>
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
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropAreaChange={onCropAreaChange}
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
              {/* Safety zone overlay — approximates where hero content overlaps the cover */}
              {showSafeZone && safeZone && (
                <div className="crop-modal__safe-zone" aria-hidden="true">
                  <div
                    className="crop-modal__safe-band"
                    style={{
                      top:    `${safeZone.band.top}%`,
                      height: `${safeZone.band.height}%`,
                    }}
                  />
                  <div
                    className="crop-modal__safe-avatar"
                    style={{
                      top:    `${safeZone.avatar.top}%`,
                      height: `${safeZone.avatar.height}%`,
                      width:  `${safeZone.avatar.width}%`,
                    }}
                  />
                  <span
                    className="crop-modal__safe-label"
                    style={{ top: `${safeZone.labelTop}%` }}
                  >
                    Zone de contenu
                  </span>
                </div>
              )}
            </div>

            {/* Zoom slider */}
            <div className="crop-modal__zoom">
              <button
                className="crop-modal__zoom-step"
                onClick={() => stepZoom(-0.1)}
                aria-label="Réduire le zoom"
              >
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
              <button
                className="crop-modal__zoom-step"
                onClick={() => stepZoom(0.1)}
                aria-label="Augmenter le zoom"
              >
                +
              </button>
              <span className="crop-modal__zoom-value" aria-live="polite">
                {Math.round(zoom * 100)} %
              </span>
            </div>

            {/* Tools row: reset + change-photo + image info */}
            <div className="crop-modal__tools">
              <button
                className="crop-modal__reset"
                onClick={handleReset}
                title="Remettre le cadrage à sa valeur initiale"
              >
                ↺ Réinitialiser le cadrage
              </button>
              {onChangePhoto && (
                <button
                  className="crop-modal__change-photo"
                  onClick={onChangePhoto}
                  title="Choisir une autre photo sans fermer la fenêtre"
                >
                  🖼️ Changer la photo
                </button>
              )}
              {imgInfo && (
                <span className="crop-modal__img-info">
                  ✔ Image prête · {imgInfo.w}×{imgInfo.h}
                </span>
              )}
            </div>

            {/* Help text */}
            <div className="crop-modal__help">
              <p className="crop-modal__help-main">{helpText}</p>
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

            {/* Preview panels — all in DOM, only active visible */}
            <div className="crop-modal__previews">
              {DEVICES.map((d) => (
                <div
                  key={d.id}
                  role="tabpanel"
                  aria-hidden={activeDevice !== d.id}
                  className={`crop-modal__preview${activeDevice === d.id ? " crop-modal__preview--active" : ""}`}
                >
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
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}
