"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { IMAGE_ACCEPT, IMAGE_POLICY, isImage, resolveImageUploadMime } from "@sonafrik/shared";
import { useCatalogService } from "../hooks/useCatalog";
import { CatalogCropModal, type CatalogCropResult } from "./CatalogCropModal";

// ─── Public handle ────────────────────────────────────────────────────────────

export interface CoverUploaderHandle {
  triggerUpload: () => Promise<void>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  albumId: string;
  creatorId: string;
  /** manual = wizard (upload via ref). immediate = upload right after crop (ReleaseList). */
  uploadMode?: "manual" | "immediate";
  onFileReady?: () => void;
  onFileCleared?: () => void;
  onSuccess?: () => void;
}

// ─── Cover dimension policy (catalog publication) ─────────────────────────────

const COVER_MIN_DIMENSION = 1400;
const COVER_RECOMMENDED = 3000;

function coverDimensionWarning(width: number, height: number): string | null {
  const minDim = Math.min(width, height);
  if (minDim >= COVER_RECOMMENDED) return null;
  return `Recommandé : ${COVER_RECOMMENDED}×${COVER_RECOMMENDED} px (actuel : ${width}×${height}).`;
}

// ─── State machine ────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; previewUrl: string; width: number; height: number; dimensionWarning: string | null }
  | { status: "uploading"; file: File; previewUrl: string; progress: number; width: number; height: number; dimensionWarning: string | null }
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
  { albumId, creatorId, uploadMode = "manual", onFileReady, onFileCleared, onSuccess },
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
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage(file.type) && !extOk) {
      return `Format non supporté (${file.type || (file.name.split(".").pop() ?? "?")}) — utilisez JPEG, PNG ou WebP.`;
    }
    if (file.size > IMAGE_POLICY.maxBytes) return `Fichier trop lourd (${formatBytes(file.size)}). Maximum ${IMAGE_POLICY.maxLabel}.`;
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

  // ── Upload ────────────────────────────────────────────────────────────────────

  const doUpload = useCallback(async (): Promise<void> => {
    const s = stateRef.current;
    if (s.status !== "preview") throw new Error("Aucune pochette sélectionnée.");
    const { file, previewUrl, width, height } = s;

    setState({ status: "uploading", file, previewUrl, progress: 0, width, height, dimensionWarning: s.dimensionWarning ?? null });
    try {
      const contentType = resolveImageUploadMime(file) ?? "image/jpeg";
      const { signedUrl, path } = await catalog.requestAssetUploadUrl({
        creatorId,
        assetType: "cover",
        contentType,
        albumId,
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setState((prev) => prev.status === "uploading" ? { ...prev, progress: Math.round((ev.loaded / ev.total) * 100) } : prev);
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Erreur serveur (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Connexion perdue pendant l'envoi."));
        xhr.send(file);
      });

      await catalog.confirmCoverUpload({ creatorId, albumId, path });

      URL.revokeObjectURL(previewUrl);
      setState({ status: "success" });
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi de la pochette.";
      setState({ status: "error", message: msg });
      throw new Error(msg);
    }
  }, [catalog, creatorId, albumId, onSuccess]);

  // ── Crop saved → preview (and optional immediate upload) ─────────────────────

  const handleCropSave = useCallback(async (result: CatalogCropResult) => {
    const croppedFile = new File([result.croppedBlob], "cover.jpg", { type: "image/jpeg" });
    const previewUrl = URL.createObjectURL(croppedFile);
    const { width, height } = await getImageDimensions(previewUrl);

    const minDim = Math.min(width, height);
    if (minDim < COVER_MIN_DIMENSION) {
      URL.revokeObjectURL(previewUrl);
      setState({
        status: "error",
        message: `Pochette trop petite (${width}×${height}). Minimum ${COVER_MIN_DIMENSION}×${COVER_MIN_DIMENSION} px.`,
      });
      return;
    }

    const prev = stateRef.current;
    if (prev.status === "preview" || prev.status === "uploading") URL.revokeObjectURL(prev.previewUrl);

    const dimensionWarning = coverDimensionWarning(width, height);
    const nextState = { status: "preview" as const, file: croppedFile, previewUrl, width, height, dimensionWarning };
    stateRef.current = nextState;
    setState(nextState);
    onFileReady?.();

    if (uploadMode === "immediate") {
      await doUpload();
    }
  }, [onFileReady, uploadMode, doUpload]);

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
    <CatalogCropModal
      key={cropSrc}
      open={cropOpen}
      onClose={handleCropClose}
      imageSrc={cropSrc}
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

            {state.dimensionWarning ? (
              <p className="cover-up__warning" role="status">{state.dimensionWarning}</p>
            ) : null}

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
          <p className="cover-up__drop-hint">JPG · PNG · WebP — max {IMAGE_POLICY.maxLabel}</p>
        </div>

        {state.status === "error" && (
          <p className="cover-up__error" role="alert">{state.message}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
});
