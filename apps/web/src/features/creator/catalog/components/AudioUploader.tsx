"use client";

import { useCallback, useRef, useState } from "react";
import {
  detectContainerFromBytes,
  mimeToUploadFormat,
  sha256Hex,
  validateAudioAsset,
  MAX_UPLOAD_BYTES,
} from "@sonafrik/shared";
import { useCatalogService } from "../hooks/useCatalog";

type AudioFormat = "mp3" | "aac";

const ACCEPTED_EXTENSIONS = ".mp3,.m4a";
const MAX_SIZE_MB = 50;

function resolveFormatFromFile(file: File): AudioFormat | null {
  const byMime = mimeToUploadFormat(file.type);
  if (byMime) return byMime === "mp3" ? "mp3" : "aac";
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp3") return "mp3";
  if (ext === "m4a") return "aac";
  return null;
}

function resolveEffectiveMime(file: File): string {
  if (file.type && mimeToUploadFormat(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  return file.type;
}

interface Props {
  trackId: string;
  creatorId: string;
  onSuccess?: (durationSeconds: number) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "analyzing"; fileName: string }
  | { status: "ready"; file: File; durationSeconds: number; format: AudioFormat }
  | { status: "uploading"; file: File; durationSeconds: number; format: AudioFormat; progress: number }
  | { status: "validating"; fileName: string }
  | { status: "success"; durationSeconds: number }
  | { status: "error"; message: string };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

async function getAudioDuration(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const decoded = await getAudioCtx().decodeAudioData(arrayBuffer.slice(0));
  return decoded.duration;
}

export function AudioUploader({ trackId, creatorId, onSuccess }: Props) {
  const catalog = useCatalogService();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  const validate = useCallback(async (file: File): Promise<string | null> => {
    const format = resolveFormatFromFile(file);
    if (!format) {
      return "Format non supporté. Choisissez un fichier MP3 ou M4A.";
    }
    if (file.size === 0) {
      return "Fichier vide.";
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      return `Fichier trop volumineux (${fileMB} MB). Maximum autorisé : ${MAX_SIZE_MB} MB.`;
    }

    const header = new Uint8Array(await file.slice(0, 512).arrayBuffer());
    const effectiveMime = resolveEffectiveMime(file);
    const precheck = validateAudioAsset({
      header,
      mime: effectiveMime,
      fileSizeBytes: file.size,
      dbFormat: format === "mp3" ? "mp3" : "aac",
    });
    if (precheck.status === "invalid") {
      return precheck.message;
    }
    if (precheck.status === "needs_review") {
      return precheck.message;
    }

    const container = detectContainerFromBytes(header);
    if (container === "unknown") {
      return "Fichier audio illisible ou corrompu.";
    }

    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setState({ status: "analyzing", fileName: file.name });

    const error = await validate(file);
    if (error) {
      setState({ status: "error", message: error });
      return;
    }

    const format: AudioFormat = resolveFormatFromFile(file) ?? "mp3";

    try {
      const durationSeconds = await getAudioDuration(file);
      if (durationSeconds <= 0) {
        setState({ status: "error", message: "Durée audio invalide." });
        return;
      }
      setState({ status: "ready", file, durationSeconds, format });
    } catch {
      setState({
        status: "error",
        message: "Impossible de décoder ce fichier. Vérifiez qu'il s'agit d'un MP3 ou M4A valide.",
      });
    }
  }, [validate]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const uploadFile = useCallback(async () => {
    if (state.status !== "ready") return;
    const { file, durationSeconds, format } = state;

    setState({ status: "uploading", file, durationSeconds, format, progress: 0 });

    try {
      const effectiveMime = resolveEffectiveMime(file);
      const { signedUrl, path } = await catalog.requestAssetUploadUrl({
        creatorId,
        assetType: "audio",
        contentType: effectiveMime,
        trackId,
        format,
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", effectiveMime);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setState((prev) =>
              prev.status === "uploading" ? { ...prev, progress: pct } : prev,
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Erreur serveur (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Connexion perdue pendant l'envoi."));
        xhr.send(file);
      });

      setState({ status: "validating", fileName: file.name });

      const contentHash = await sha256Hex(await file.arrayBuffer());
      const confirm = await catalog.confirmAssetUpload({
        creatorId,
        trackId,
        path,
        format,
        contentType: file.type,
        fileSizeBytes: file.size,
        durationSeconds: Math.round(durationSeconds),
        contentHash,
      });

      if (confirm.integrityStatus === "invalid") {
        throw new Error(confirm.message || "Fichier rejeté après validation serveur.");
      }

      setState({ status: "success", durationSeconds });
      onSuccess?.(Math.round(durationSeconds));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi du fichier audio.";
      setState({ status: "error", message: msg });
    }
  }, [state, catalog, creatorId, trackId, onSuccess]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  if (state.status === "success") {
    return (
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--color-vert-energie)" }} className="text-sm font-medium">
          ✓ Fichier audio validé
          {state.durationSeconds > 0 ? ` (${formatDuration(state.durationSeconds)})` : ""}
        </span>
        <button onClick={reset} className="text-xs underline" style={{ color: "var(--color-texte-secondaire)" }}>
          Remplacer
        </button>
      </div>
    );
  }

  if (state.status === "analyzing" || state.status === "validating") {
    return (
      <div className="flex items-center gap-2 py-2">
        <div
          className="w-4 h-4 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
          {state.status === "analyzing" ? `Analyse de ${state.fileName}…` : `Validation serveur de ${state.fileName}…`}
        </span>
      </div>
    );
  }

  if (state.status === "ready" || state.status === "uploading") {
    const isUploading = state.status === "uploading";
    return (
      <div className="space-y-3">
        <div
          className="flex items-center gap-4 rounded-xl p-4"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-bordure)" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-elevated)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4L8 16" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 7L4 13" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 6L12 14" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 8L16 12" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--color-texte-principal)" }}>
              {state.file.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
              {state.format.toUpperCase()} · {formatBytes(state.file.size)}
              {state.durationSeconds > 0 ? ` · ${formatDuration(state.durationSeconds)}` : ""}
            </p>

            {isUploading && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bordure)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${state.progress}%`, backgroundColor: "var(--color-vert-energie)" }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
                  {state.progress}% envoyé…
                </p>
              </div>
            )}
          </div>
        </div>

        {!isUploading && (
          <div className="flex gap-2">
            <button
              onClick={() => void uploadFile()}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
            >
              Envoyer le fichier audio
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-2 rounded-xl p-6 cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${isDragOver ? "var(--color-vert-energie)" : "var(--color-bordure)"}`,
          backgroundColor: isDragOver ? "rgba(0,210,106,0.04)" : "var(--color-surface)",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="10" width="24" height="16" rx="3" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
          <circle cx="10" cy="18" r="2.5" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
          <path d="M13 18h9" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 4v8M13 7l3-3 3 3" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
          Glissez un fichier audio ou cliquez pour choisir
        </p>
        <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
          MP3 · M4A — max {MAX_SIZE_MB} MB
        </p>
      </div>

      {state.status === "error" && (
        <p className="text-xs px-1" style={{ color: "var(--color-danger)" }}>
          {state.message}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
