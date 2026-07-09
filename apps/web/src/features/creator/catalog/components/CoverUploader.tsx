"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { generateDefaultArtwork } from "@sonafrik/api/catalog";
import { IMAGE_POLICY } from "@sonafrik/shared";
import {
  SMART_COVER_MESSAGES,
  mapCoverErrorToUserMessage,
} from "@sonafrik/shared/cover";
import { uploadAssetToSignedUrl } from "@/lib/upload/uploadAsset";
import { useCatalogService } from "../hooks/useCatalog";
import {
  AUTO_IMAGE_VARIANTS,
  type AutoImagePrepared,
} from "@/features/shared/media/autoImagePipeline";
import { useAutoImageUpload } from "@/features/shared/media/useAutoImageUpload";

// ─── Public handle ────────────────────────────────────────────────────────────

export type EnsureCoverContext = {
  trackTitle: string;
  artistName: string;
  creatorId?: string;
};

export interface CoverUploaderHandle {
  triggerUpload: () => Promise<void>;
  ensureCover: (ctx: EnsureCoverContext) => Promise<{ source: "user" | "auto" }>;
  openFilePicker: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  albumId: string;
  creatorId: string;
  coverEngine?: "legacy" | "smart";
  uploadMode?: "manual" | "immediate";
  onFileReady?: () => void;
  onFileCleared?: () => void;
  onSuccess?: () => void;
  onCoverDefined?: (source: "user" | "auto") => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "processing"; message: string }
  | {
      status: "preview";
      file: File;
      previewUrl: string;
      width: number;
      height: number;
      notice: string | null;
    }
  | {
      status: "uploading";
      file: File;
      previewUrl: string;
      progress: number;
      width: number;
      height: number;
      notice: string | null;
    }
  | { status: "success"; source: "user" | "auto"; message: string }
  | { status: "error"; message: string; blocking: boolean };

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CoverUploader = forwardRef<CoverUploaderHandle, Props>(function CoverUploader(
  {
    albumId,
    creatorId,
    coverEngine = "legacy",
    uploadMode: _uploadMode = "manual",
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
  const uploadPrepared = useCallback(async (
    prepared: AutoImagePrepared,
    creatorIdOverride?: string,
  ): Promise<void> => {
    const effectiveCreatorId = creatorIdOverride ?? creatorId;
    const previewUrl = URL.createObjectURL(prepared.file);

    setState({
      status: "uploading",
      file: prepared.file,
      previewUrl,
      progress: 0,
      width: prepared.width,
      height: prepared.height,
      notice: isSmart ? SMART_COVER_MESSAGES.optimized : "Pochette optimisée automatiquement.",
    });

    try {
      const { signedUrl, path } = await catalog.requestAssetUploadUrl({
        creatorId: effectiveCreatorId,
        assetType: "cover",
        contentType: prepared.contentType,
        albumId,
      });

      await uploadAssetToSignedUrl(signedUrl, prepared.file, {
        contentType: prepared.contentType,
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
        message: isSmart ? SMART_COVER_MESSAGES.ready : "Pochette enregistrée",
      });
      onCoverDefined?.("user");
      onFileReady?.();
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
  }, [catalog, creatorId, albumId, isSmart, onCoverDefined, onFileReady, onSuccess]);

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

      await uploadAutoCover(ctx);
      return { source: "auto" };
    },
    [uploadAutoCover],
  );

  const {
    error,
    accept,
    handleInputChange,
  } = useAutoImageUpload({
    variant: AUTO_IMAGE_VARIANTS.squareCover,
    onUpload: async (prepared) => {
      setState({ status: "processing", message: SMART_COVER_MESSAGES.processing });
      await uploadPrepared(prepared);
    },
  });

  const onInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleInputChange(e);
    const current = stateRef.current;
    if (current.status !== "error" && error) {
      setState({ status: "error", message: error, blocking: true });
    }
  }, [error, handleInputChange]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const fakeEvent = {
        target: { files: [file], value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleInputChange(fakeEvent);
    },
    [handleInputChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      triggerUpload: async () => undefined,
      ensureCover,
      openFilePicker: () => {
        const s = stateRef.current;
        if (s.status === "success") {
          setState({ status: "idle" });
          requestAnimationFrame(() => inputRef.current?.click());
          return;
        }
        inputRef.current?.click();
      },
    }),
    [ensureCover],
  );

  const reset = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "preview" || s.status === "uploading") URL.revokeObjectURL(s.previewUrl);
    setState({ status: "idle" });
    onFileCleared?.();
  }, [onFileCleared]);

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="sr-only"
      aria-hidden="true"
      tabIndex={-1}
      onChange={(e) => void onInputChange(e)}
    />
  );

  if (state.status === "success") {
    return (
      <>
        <div className="cover-up__success">
          <span className="cover-up__success-icon">✓</span>
          <span>{state.message}</span>
        </div>
        {hiddenInput}
      </>
    );
  }

  if (state.status === "processing") {
    return (
      <>
        <div className="cover-up__processing" aria-busy="true" aria-live="polite">
          <span className="cover-up__processing-spin" aria-hidden="true">◌</span>
          <span>{state.message}</span>
        </div>
        {hiddenInput}
      </>
    );
  }

  if (state.status === "preview" || state.status === "uploading") {
    const isUploading = state.status === "uploading";
    const progress = isUploading ? state.progress : 0;

    return (
      <>
        <div className="cover-up__preview">
          <div className="cover-up__thumb-static">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.previewUrl} alt="Aperçu de la pochette" className="cover-up__thumb" />
          </div>

          <div className="cover-up__info">
            <p className="cover-up__filename">{state.file.name}</p>
            <p className="cover-up__meta">
              {state.width > 0 ? `${state.width}×${state.height} · ` : ""}
              {formatBytes(state.file.size)}
            </p>

            {state.notice ? (
              <p className="cover-up__notice" role="status">
                {state.notice}
              </p>
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
        {hiddenInput}
      </>
    );
  }

  return (
    <>
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
              : `Choisissez une image, SONAFRIK recadre et enregistre automatiquement · max ${IMAGE_POLICY.maxLabel}`}
          </p>
          <p className="cover-up__drop-hint cover-up__drop-hint--soft">
            Sans image, SONAFRIK créera une pochette automatique pour vous.
          </p>
        </div>

        {(state.status === "error" || error) && (
          <p className="cover-up__error" role="alert">
            {state.status === "error" ? state.message : error}
          </p>
        )}
      </div>
      {hiddenInput}
    </>
  );
});
