"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useCatalogService } from "../hooks/useCatalog";
import { CropEditorModal } from "../../dashboard/components/CropEditorModal";
import type { CropResult } from "../../dashboard/components/CropEditorModal";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_SIZE_LABEL = "5 Mo";

// ─── Public handle ────────────────────────────────────────────────────────────

export interface CoverUploaderHandle {
  triggerUpload: () => Promise<void>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  albumId: string;
  creatorId: string;
  onFileReady?: () => void;
  onFileCleared?: () => void;
  onSuccess?: () => void;
}

// ─── State machine ────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; previewUrl: string; width: number; height: number }
  | { status: "uploading"; file: File; previewUrl: string; progress: number; width: number; height: number }
  | { status: "success" }
  | { status: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CoverUploader = forwardRef<CoverUploaderHandle, Props>(function CoverUploader(
  { albumId, creatorId, onFileReady, onFileCleared, onSuccess },
  ref,
) {
  const catalog = useCatalogService();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>({ status: "idle" });
  const stateRef = useRef(state);
  stateRef.current = state;

  const [isDragOver, setIsDragOver] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const originalFileRef = useRef<File | null>(null);

  // ── Validate ─────────────────────────────────────────────────────────────────

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Format non accepté. Utilisez JPEG, PNG ou WebP.";
    if (file.size > MAX_SIZE_BYTES) return `Fichier trop lourd (${formatBytes(file.size)}). Maximum ${MAX_SIZE_LABEL}.`;
    return null;
  }, []);

  // ── File selection → open crop editor ─────────────────────────────────────────

  const openCrop = useCallback((file: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
  }, [cropSrc]);

  const handleFile = useCallback((file: File) => {
    const error = validate(file);
    if (error) { setState({ status: "error", message: error }); return; }
    originalFileRef.current = file;
    openCrop(file);
  }, [validate, openCrop]);

  // ── Crop saved → go to preview ────────────────────────────────────────────────

  const handleCropSave = useCallback(async (result: CropResult) => {
    const croppedFile = new File([result.croppedBlob], "cover.jpg", { type: "image/jpeg" });
    const previewUrl = URL.createObjectURL(croppedFile);
    const { width, height } = await getImageDimensions(previewUrl);

    const prev = stateRef.current;
    if (prev.status === "preview" || prev.status === "uploading") URL.revokeObjectURL(prev.previewUrl);

    setState({ status: "preview", file: croppedFile, previewUrl, width, height });
    onFileReady?.();
  }, [onFileReady]);

  const handleCropClose = useCallback(() => {
    setCropOpen(false);
    if (cropSrc) { URL.revokeObjectURL(cropSrc); setCropSrc(null); }
  }, [cropSrc]);

  // ── Thumbnail click → re-crop from original ────────────────────────────────────

  const handleThumbnailClick = useCallback(() => {
    if (stateRef.current.status !== "preview") return;
    const src = originalFileRef.current ?? stateRef.current.file;
    openCrop(src);
  }, [openCrop]);

  // ── Input / Drop ──────────────────────────────────────────────────────────────

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Upload ────────────────────────────────────────────────────────────────────

  const doUpload = useCallback(async (): Promise<void> => {
    const s = stateRef.current;
    if (s.status !== "preview") throw new Error("Aucune pochette sélectionnée.");
    const { file, previewUrl, width, height } = s;

    setState({ status: "uploading", file, previewUrl, progress: 0, width, height });
    try {
      const { signedUrl } = await catalog.requestAssetUploadUrl({ creatorId, assetType: "cover", contentType: file.type, albumId });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setState((prev) => prev.status === "uploading" ? { ...prev, progress: Math.round((ev.loaded / ev.total) * 100) } : prev);
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Erreur serveur (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Connexion perdue pendant l'envoi."));
        xhr.send(file);
      });

      URL.revokeObjectURL(previewUrl);
      setState({ status: "success" });
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi de la pochette.";
      setState({ status: "error", message: msg });
      throw new Error(msg);
    }
  }, [catalog, creatorId, albumId, onSuccess]);

  // ── Imperative handle ─────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    triggerUpload: async () => {
      const s = stateRef.current;
      if (s.status === "success") return;
      await doUpload();
    },
  }), [doUpload]);

  // ── Reset ─────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "preview" || s.status === "uploading") URL.revokeObjectURL(s.previewUrl);
    if (cropSrc) { URL.revokeObjectURL(cropSrc); setCropSrc(null); }
    originalFileRef.current = null;
    setState({ status: "idle" });
    onFileCleared?.();
  }, [cropSrc, onFileCleared]);

  // ── Crop modal (rendered at root to persist across state changes) ──────────────

  const cropModal = cropSrc ? (
    <CropEditorModal
      key={cropSrc}
      open={cropOpen}
      onClose={handleCropClose}
      imageSrc={cropSrc}
      aspect={1}
      title="Recadrer la pochette"
      onSave={handleCropSave}
    />
  ) : null;

  // ── Success ────────────────────────────────────────────────────────────────────

  if (state.status === "success") {
    return (
      <>
        {cropModal}
        <div className="cover-up__success">
          <span className="cover-up__success-icon">✓</span>
          <span>Pochette validée</span>
        </div>
      </>
    );
  }

  // ── Preview / Uploading ────────────────────────────────────────────────────────

  if (state.status === "preview" || state.status === "uploading") {
    const isUploading = state.status === "uploading";
    const progress = isUploading ? state.progress : 0;

    return (
      <>
        {cropModal}
        <div className="cover-up__preview">
          <button
            className="cover-up__thumb-btn"
            onClick={handleThumbnailClick}
            disabled={isUploading}
            aria-label="Cliquer pour recadrer la pochette"
            title="Cliquer pour recadrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.previewUrl}
              alt="Aperçu de la pochette"
              className="cover-up__thumb"
            />
            {!isUploading && (
              <div className="cover-up__thumb-overlay" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 11L5 8l3 3 3-4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M11 2L14 5M13 1l2 2-8 8H5v-2L13 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                Recadrer
              </div>
            )}
          </button>

          <div className="cover-up__info">
            <p className="cover-up__filename">{state.file.name}</p>
            <p className="cover-up__meta">
              {state.width > 0 ? `${state.width}×${state.height} · ` : ""}
              {formatBytes(state.file.size)}
            </p>

            {isUploading ? (
              <div className="cover-up__progress">
                <div className="cover-up__progress-track">
                  <div className="cover-up__progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="cover-up__progress-label">{progress}% envoyé…</span>
              </div>
            ) : (
              <button className="cover-up__change" onClick={reset}>
                Changer
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Idle / Error — Drop zone ───────────────────────────────────────────────────

  return (
    <>
      {cropModal}
      <div className="cover-up__wrap">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`cover-up__drop${isDragOver ? " cover-up__drop--over" : ""}`}
          aria-label="Zone de dépôt de la pochette"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="24" height="18" rx="3" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
            <circle cx="11" cy="14" r="2" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
            <path d="M4 22l7-5 5 4 4-3 8 5" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 4v8M13 7l3-3 3 3" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="cover-up__drop-label">Glissez une image ou cliquez</p>
          <p className="cover-up__drop-hint">JPG · PNG · WebP — max {MAX_SIZE_LABEL}</p>
        </div>

        {state.status === "error" && (
          <p className="cover-up__error" role="alert">{state.message}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
});
