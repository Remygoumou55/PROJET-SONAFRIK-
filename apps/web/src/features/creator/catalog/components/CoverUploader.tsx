"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { generateDefaultArtwork } from "@sonafrik/api/catalog";
import { IMAGE_ACCEPT, IMAGE_POLICY, isImage, resolveImageUploadMime } from "@sonafrik/shared";
import {
  SmartCoverEngine,
  SMART_COVER_MESSAGES,
  mapCoverErrorToUserMessage,
} from "@sonafrik/shared/cover";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { useCatalogService } from "../hooks/useCatalog";
import { CatalogCropModal, type CatalogCropResult } from "./CatalogCropModal";

// ─── Public handle ────────────────────────────────────────────────────────────

export type EnsureCoverContext = {
  trackTitle: string;
  artistName: string;
  creatorId?: string;
};

export interface CoverUploaderHandle {
  triggerUpload: () => Promise<void>;
  ensureCover: (ctx: EnsureCoverContext) => Promise<{ source: "user" | "auto" }>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  albumId: string;
  creatorId: string;
  /** legacy = recadrage modal obligatoire (TrackEditor, ReleaseList). smart = Smart Cover Engine (wizard étape 2). */
  coverEngine?: "legacy" | "smart";
  uploadMode?: "manual" | "immediate";
  onFileReady?: () => void;
  onFileCleared?: () => void;
  onSuccess?: () => void;
  onCoverDefined?: (source: "user" | "auto") => void;
}

// ─── Legacy dimension policy ──────────────────────────────────────────────────

const COVER_MIN_DIMENSION = 1400;
const COVER_RECOMMENDED = 3000;

const ADVISORY_SMALL =
  "Votre image est de qualité insuffisante. SONAFRIK utilisera temporairement une pochette automatique. Vous pourrez la remplacer quand vous le souhaiterez.";

const ADVISORY_CORRUPT =
  "Impossible de lire cette image. SONAFRIK utilisera temporairement une pochette automatique. Vous pourrez la remplacer quand vous le souhaiterez.";

function coverDimensionWarning(width: number, height: number): string | null {
  const minDim = Math.min(width, height);
  if (minDim >= COVER_RECOMMENDED) return null;
  if (minDim >= COVER_MIN_DIMENSION) {
    return `Recommandé : ${COVER_RECOMMENDED}×${COVER_RECOMMENDED} px (actuel : ${width}×${height}).`;
  }
  return null;
}

// ─── State machine ────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "processing"; message: string }
  | {
      status: "preview";
      file: File;
      previewUrl: string;
      width: number;
      height: number;
      dimensionWarning: string | null;
      notice: string | null;
    }
  | {
      status: "uploading";
      file: File;
      previewUrl: string;
      progress: number;
      width: number;
      height: number;
      dimensionWarning: string | null;
      notice: string | null;
    }
  | { status: "success"; source: "user" | "auto"; message: string }
  | { status: "advisory"; message: string }
  | { status: "error"; message: string; blocking: boolean };

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
  {
    albumId,
    creatorId,
    coverEngine = "legacy",
    uploadMode = "manual",
    onFileReady,
    onFileCleared,
    onSuccess,
    onCoverDefined,
  },
  ref,
) {
  const catalog = useCatalogService();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSmart = coverEngine === "smart";

  const [state, setState] = useState<UploadState>({ status: "idle" });
  const stateRef = useRef(state);
  stateRef.current = state;

  const [isDragOver, setIsDragOver] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const originalFileRef = useRef<File | null>(null);

  const uploadUserPreview = useCallback(async (creatorIdOverride?: string): Promise<void> => {
    const effectiveCreatorId = creatorIdOverride ?? creatorId;
    const s = stateRef.current;
    if (s.status !== "preview") throw new Error("Aucune pochette sélectionnée.");
    const { file, previewUrl, width, height, dimensionWarning, notice } = s;

    setState({
      status: "uploading",
      file,
      previewUrl,
      progress: 0,
      width,
      height,
      dimensionWarning: dimensionWarning ?? null,
      notice: notice ?? null,
    });

    try {
      const contentType = resolveImageUploadMime(file) ?? "image/jpeg";
      const { signedUrl, path } = await catalog.requestAssetUploadUrl({
        creatorId: effectiveCreatorId,
        assetType: "cover",
        contentType,
        albumId,
      });

      await uploadAssetToSignedUrl(signedUrl, file, {
        contentType,
        onProgress: (pct) =>
          setState((prev) =>
            prev.status === "uploading" ? { ...prev, progress: pct } : prev,
          ),
      });

      await catalog.confirmCoverUploadWithRetry({ creatorId: effectiveCreatorId, albumId, path });
      await catalog.applyCoverArtworkState(albumId, "user");

      URL.revokeObjectURL(previewUrl);
      setState({
        status: "success",
        source: "user",
        message: isSmart ? SMART_COVER_MESSAGES.ready : "Pochette validée",
      });
      onCoverDefined?.("user");
      onSuccess?.();
    } catch (err) {
      const msg = isSmart
        ? mapCoverErrorToUserMessage(err, IMAGE_POLICY.maxLabel)
        : err instanceof Error
          ? err.message
          : "Échec de l'envoi de la pochette.";
      setState({ status: "error", message: msg, blocking: true });
      throw new Error(msg);
    }
  }, [catalog, creatorId, albumId, onSuccess, onCoverDefined, isSmart]);

  const uploadAutoCover = useCallback(
    async (ctx: EnsureCoverContext): Promise<void> => {
      const effectiveCreatorId = ctx.creatorId ?? creatorId;
      const { blob, contentType } = await generateDefaultArtwork({
        trackTitle: ctx.trackTitle,
        artistName: ctx.artistName,
      });

      await catalog.uploadCoverBlob({
        creatorId: effectiveCreatorId,
        albumId,
        blob,
        contentType,
        source: "auto",
      });

      setState({
        status: "success",
        source: "auto",
        message: isSmart ? SMART_COVER_MESSAGES.ready : "Pochette automatique appliquée",
      });
      onCoverDefined?.("auto");
      onSuccess?.();
    },
    [catalog, creatorId, albumId, onSuccess, onCoverDefined, isSmart],
  );

  const ensureCover = useCallback(
    async (ctx: EnsureCoverContext): Promise<{ source: "user" | "auto" }> => {
      const s = stateRef.current;
      if (s.status === "success") return { source: s.source };

      if (s.status === "preview") {
        await uploadUserPreview(ctx.creatorId);
        return { source: "user" };
      }

      await uploadAutoCover(ctx);
      return { source: "auto" };
    },
    [uploadUserPreview, uploadAutoCover],
  );

  const validateLegacy = useCallback((file: File): string | null => {
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage(file.type) && !extOk) {
      return `Format non supporté (${file.type || (file.name.split(".").pop() ?? "?")}) — utilisez JPEG, PNG ou WebP.`;
    }
    if (file.size > IMAGE_POLICY.maxBytes) {
      return `Fichier trop lourd (${formatBytes(file.size)}). Maximum ${IMAGE_POLICY.maxLabel}.`;
    }
    return null;
  }, []);

  const applyPreview = useCallback(
    (file: File, previewUrl: string, width: number, height: number, dimensionWarning: string | null, notice: string | null) => {
      const prev = stateRef.current;
      if (prev.status === "preview" || prev.status === "uploading") {
        URL.revokeObjectURL(prev.previewUrl);
      }

      const nextState = {
        status: "preview" as const,
        file,
        previewUrl,
        width,
        height,
        dimensionWarning,
        notice,
      };
      stateRef.current = nextState;
      setState(nextState);
      onFileReady?.();
    },
    [onFileReady],
  );

  const processSmartCover = useCallback(
    async (file: File) => {
      originalFileRef.current = file;
      setState({ status: "processing", message: SMART_COVER_MESSAGES.processing });
      try {
        const result = await SmartCoverEngine.processAutomatic(file);
        const previewUrl = URL.createObjectURL(result.file);
        applyPreview(
          result.file,
          previewUrl,
          result.width,
          result.height,
          null,
          result.advisory ?? (result.wasOptimized ? SMART_COVER_MESSAGES.optimized : null),
        );
        if (uploadMode === "immediate") {
          await uploadUserPreview();
        }
      } catch (err) {
        setState({
          status: "error",
          message: mapCoverErrorToUserMessage(err, IMAGE_POLICY.maxLabel),
          blocking: true,
        });
      }
    },
    [applyPreview, uploadMode, uploadUserPreview],
  );

  const openCrop = useCallback(
    (file: File) => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      const url = URL.createObjectURL(file);
      setCropSrc(url);
      setCropOpen(true);
    },
    [cropSrc],
  );

  const handleFileLegacy = useCallback(
    (file: File) => {
      const error = validateLegacy(file);
      if (error) {
        setState({ status: "error", message: error, blocking: true });
        return;
      }
      originalFileRef.current = file;
      openCrop(file);
    },
    [validateLegacy, openCrop],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (isSmart) {
        void processSmartCover(file);
        return;
      }
      handleFileLegacy(file);
    },
    [isSmart, processSmartCover, handleFileLegacy],
  );

  const handleCropSaveLegacy = useCallback(
    async (result: CatalogCropResult) => {
      const croppedFile = new File([result.croppedBlob], "cover.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(croppedFile);
      const { width, height } = await getImageDimensions(previewUrl);

      if (width === 0 || height === 0) {
        URL.revokeObjectURL(previewUrl);
        setState({ status: "advisory", message: ADVISORY_CORRUPT });
        onFileCleared?.();
        return;
      }

      const minDim = Math.min(width, height);
      if (minDim < COVER_MIN_DIMENSION) {
        URL.revokeObjectURL(previewUrl);
        setState({ status: "advisory", message: ADVISORY_SMALL });
        onFileCleared?.();
        return;
      }

      applyPreview(croppedFile, previewUrl, width, height, coverDimensionWarning(width, height), null);

      if (uploadMode === "immediate") {
        await uploadUserPreview();
      }
    },
    [applyPreview, uploadMode, uploadUserPreview, onFileCleared],
  );

  const handleCropSaveSmart = useCallback(
    async (result: CatalogCropResult) => {
      setState({ status: "processing", message: SMART_COVER_MESSAGES.processing });
      try {
        const processed = await SmartCoverEngine.processManualCrop(
          result.croppedBlob,
          originalFileRef.current?.name ?? "cover",
        );
        const previewUrl = URL.createObjectURL(processed.file);
        applyPreview(
          processed.file,
          previewUrl,
          processed.width,
          processed.height,
          null,
          processed.advisory ?? SMART_COVER_MESSAGES.optimized,
        );
        if (uploadMode === "immediate") {
          await uploadUserPreview();
        }
      } catch (err) {
        setState({
          status: "error",
          message: mapCoverErrorToUserMessage(err, IMAGE_POLICY.maxLabel),
          blocking: true,
        });
      }
    },
    [applyPreview, uploadMode, uploadUserPreview],
  );

  const handleCropSave = isSmart ? handleCropSaveSmart : handleCropSaveLegacy;

  const handleCropClose = useCallback(() => {
    setCropOpen(false);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  }, [cropSrc]);

  const handleAdjustCrop = useCallback(() => {
    const src = originalFileRef.current ?? (stateRef.current.status === "preview" ? stateRef.current.file : null);
    if (!src) return;
    openCrop(src);
  }, [openCrop]);

  const handleThumbnailClick = useCallback(() => {
    if (!isSmart && stateRef.current.status === "preview") {
      const src = originalFileRef.current ?? stateRef.current.file;
      openCrop(src);
    }
  }, [isSmart, openCrop]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  useImperativeHandle(
    ref,
    () => ({
      triggerUpload: uploadUserPreview,
      ensureCover,
    }),
    [uploadUserPreview, ensureCover],
  );

  const reset = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "preview" || s.status === "uploading") URL.revokeObjectURL(s.previewUrl);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
    originalFileRef.current = null;
    setState({ status: "idle" });
    onFileCleared?.();
  }, [cropSrc, onFileCleared]);

  const cropModal = cropSrc ? (
    <CatalogCropModal
      key={cropSrc}
      open={cropOpen}
      onClose={handleCropClose}
      imageSrc={cropSrc}
      title={isSmart ? "Ajuster le cadrage" : "Recadrer la pochette"}
      onSave={handleCropSave}
    />
  ) : null;

  if (state.status === "success") {
    return (
      <>
        {cropModal}
        <div className="cover-up__success">
          <span className="cover-up__success-icon">✓</span>
          <span>{state.message}</span>
        </div>
      </>
    );
  }

  if (state.status === "processing") {
    return (
      <>
        {cropModal}
        <div className="cover-up__processing" aria-busy="true" aria-live="polite">
          <span className="cover-up__processing-spin" aria-hidden="true">◌</span>
          <span>{state.message}</span>
        </div>
      </>
    );
  }

  if (state.status === "preview" || state.status === "uploading") {
    const isUploading = state.status === "uploading";
    const progress = isUploading ? state.progress : 0;

    return (
      <>
        {cropModal}
        <div className="cover-up__preview">
          {isSmart ? (
            <div className="cover-up__thumb-static">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.previewUrl} alt="Aperçu de la pochette" className="cover-up__thumb" />
            </div>
          ) : (
            <button
              className="cover-up__thumb-btn"
              onClick={handleThumbnailClick}
              disabled={isUploading}
              aria-label="Cliquer pour recadrer la pochette"
              title="Cliquer pour recadrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.previewUrl} alt="Aperçu de la pochette" className="cover-up__thumb" />
              {!isUploading && (
                <div className="cover-up__thumb-overlay" aria-hidden="true">
                  Recadrer
                </div>
              )}
            </button>
          )}

          <div className="cover-up__info">
            {!isSmart && <p className="cover-up__filename">{state.file.name}</p>}
            {!isSmart && (
              <p className="cover-up__meta">
                {state.width > 0 ? `${state.width}×${state.height} · ` : ""}
                {formatBytes(state.file.size)}
              </p>
            )}

            {state.notice ? (
              <p className="cover-up__notice" role="status">
                {state.notice}
              </p>
            ) : null}

            {state.dimensionWarning ? (
              <p className="cover-up__warning" role="status">
                {state.dimensionWarning}
              </p>
            ) : null}

            {isSmart && !isUploading ? (
              <button type="button" className="cover-up__adjust" onClick={handleAdjustCrop}>
                Ajuster le cadrage
              </button>
            ) : null}

            {isUploading ? (
              <div className="cover-up__progress">
                <div className="cover-up__progress-track">
                  <div className="cover-up__progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="cover-up__progress-label">Envoi en cours…</span>
              </div>
            ) : (
              <button type="button" className="cover-up__change" onClick={reset}>
                Changer
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {cropModal}
      <div className="cover-up__wrap">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`cover-up__drop${isDragOver ? " cover-up__drop--over" : ""}${isSmart ? " cover-up__drop--smart" : ""}`}
          aria-label="Zone de dépôt de la pochette"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="24" height="18" rx="3" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
            <circle cx="11" cy="14" r="2" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
            <path d="M4 22l7-5 5 4 4-3 8 5" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 4v8M13 7l3-3 3 3" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="cover-up__drop-label">
            {isSmart ? "Choisir une image" : "Glissez une image ou cliquez"}
          </p>
          <p className="cover-up__drop-hint">
            {isSmart
              ? "SONAFRIK optimise automatiquement votre pochette."
              : `Optionnel — JPG · PNG · WebP · max ${IMAGE_POLICY.maxLabel}`}
          </p>
          {!isSmart && (
            <p className="cover-up__drop-hint cover-up__drop-hint--soft">
              Sans image, SONAFRIK créera une pochette automatique pour vous.
            </p>
          )}
        </div>

        {state.status === "advisory" && (
          <p className="cover-up__advisory" role="status">
            {state.message}
          </p>
        )}

        {state.status === "error" && (
          <p className="cover-up__error" role="alert">
            {state.message}
          </p>
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
