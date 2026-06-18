"use client";

import { useCallback, useRef, useState } from "react";
import { useCatalogService } from "../hooks/useCatalog";

const ACCEPTED_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3":  "mp3",
  "audio/wav":  "wav",
  "audio/x-wav": "wav",
  "audio/m4a":  "m4a",
  "audio/mp4":  "m4a",
  "audio/x-m4a": "m4a",
};
const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a";
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_SIZE_LABEL = "50 Mo";

interface Props {
  trackId: string;
  creatorId: string;
  onSuccess?: (durationSeconds: number) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "analyzing"; fileName: string }
  | { status: "ready"; file: File; durationSeconds: number; format: string }
  | { status: "uploading"; file: File; durationSeconds: number; format: string; progress: number }
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

// Singleton — les navigateurs limitent le nombre de AudioContext simultanés (~25 sur Chrome)
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

async function getAudioDuration(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  // slice(0) évite la détachement du buffer sur certains navigateurs
  const decoded = await getAudioCtx().decodeAudioData(arrayBuffer.slice(0));
  return decoded.duration;
}

export function AudioUploader({ trackId, creatorId, onSuccess }: Props) {
  const catalog = useCatalogService();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  const validate = useCallback((file: File): string | null => {
    const format = ACCEPTED_TYPES[file.type];
    if (!format) {
      return "Format non accepté. Utilisez MP3, WAV ou M4A.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Fichier trop lourd (${formatBytes(file.size)}). Maximum ${MAX_SIZE_LABEL}.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const error = validate(file);
    if (error) {
      setState({ status: "error", message: error });
      return;
    }

    const format = ACCEPTED_TYPES[file.type] ?? "mp3";
    setState({ status: "analyzing", fileName: file.name });

    try {
      const durationSeconds = await getAudioDuration(file);
      setState({ status: "ready", file, durationSeconds, format });
    } catch {
      // Si Web Audio API échoue (rare), on continue sans durée connue
      setState({ status: "ready", file, durationSeconds: 0, format });
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
      const { signedUrl } = await catalog.requestAssetUploadUrl({
        creatorId,
        assetType: "audio",
        contentType: file.type,
        trackId,
        format: format as "mp3" | "aac" | "flac" | "wav",
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setState((prev) =>
              prev.status === "uploading" ? { ...prev, progress: pct } : prev,
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Erreur serveur (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Connexion perdue pendant l'envoi."));
        xhr.send(file);
      });

      setState({ status: "success", durationSeconds });
      onSuccess?.(Math.round(durationSeconds));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi du fichier audio.";
      setState({ status: "error", message: msg });
    }
  }, [state, catalog, creatorId, trackId, onSuccess]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (state.status === "success") {
    return (
      <div className="flex items-center gap-2">
        <span style={{ color: "#00D26A" }} className="text-sm font-medium">
          ✓ Fichier audio envoyé
          {state.durationSeconds > 0
            ? ` (${formatDuration(state.durationSeconds)})`
            : ""}
        </span>
        <button onClick={reset} className="text-xs underline" style={{ color: "#A0A0A0" }}>
          Remplacer
        </button>
      </div>
    );
  }

  if (state.status === "analyzing") {
    return (
      <div className="flex items-center gap-2 py-2">
        <div
          className="w-4 h-4 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: "#A0A0A0" }}>
          Analyse de {state.fileName}…
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
          style={{ backgroundColor: "#1A1A1A", border: "1px solid #333333" }}
        >
          {/* Icône audio */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#2A2A2A" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4L8 16" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 7L4 13" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 6L12 14" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 8L16 12" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
              {state.file.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#A0A0A0" }}>
              {state.format.toUpperCase()} · {formatBytes(state.file.size)}
              {state.durationSeconds > 0
                ? ` · ${formatDuration(state.durationSeconds)}`
                : ""}
            </p>

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-2">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "#333333" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${state.progress}%`, backgroundColor: "#00D26A" }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: "#A0A0A0" }}>
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
              style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
            >
              Envoyer le fichier audio
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0" }}
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
      {/* Zone drag-and-drop */}
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
          border: `2px dashed ${isDragOver ? "#00D26A" : "#333333"}`,
          backgroundColor: isDragOver ? "#001a0d" : "#1A1A1A",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="10" width="24" height="16" rx="3" stroke="#555555" strokeWidth="1.5" />
          <circle cx="10" cy="18" r="2.5" stroke="#555555" strokeWidth="1.5" />
          <path d="M13 18h9" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 4v8M13 7l3-3 3 3" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
          Glissez un fichier audio ou cliquez pour choisir
        </p>
        <p className="text-xs" style={{ color: "#555555" }}>
          MP3 · WAV · M4A — max {MAX_SIZE_LABEL}
        </p>
      </div>

      {/* Message d'erreur */}
      {state.status === "error" && (
        <p className="text-xs px-1" style={{ color: "#FF4444" }}>
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
