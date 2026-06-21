"use client";

import { useCallback, useRef, useState } from "react";
import { useCatalogService } from "../hooks/useCatalog";

type AudioFormat = "mp3" | "aac" | "wav";

// RESTRICTION TEMPORAIRE (sprint 20260620) : FLAC et OGG retirés car aucun
// système de transcodage n'existe encore — ces formats seraient streamés
// tels quels aux auditeurs, annulant l'effet du mode économie de données
// (useStreamQuality). À réactiver une fois le transcodage post-upload
// implémenté (cf. rapport d'audit du sprint "formats audio élargis").
const ACCEPTED_TYPES: Record<string, AudioFormat> = {
  "audio/mpeg":  "mp3",
  "audio/mp3":   "mp3",
  "audio/wav":   "wav",
  "audio/x-wav": "wav",
  "audio/m4a":   "aac",  // M4A = AAC dans container MP4
  "audio/mp4":   "aac",
  "audio/x-m4a": "aac",
};
const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a";
// 50 MB — limite du plan Supabase Storage Free (non modifiable sans upgrade de plan)
const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_SIZE_MB = 50;

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
      return "Format non supporté. Formats acceptés actuellement : MP3, WAV, M4A. Le support FLAC et OGG sera réactivé une fois notre système de conversion audio mis en place, pour garantir une expérience optimale à tous les auditeurs quel que soit leur réseau.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      return `Fichier trop volumineux (${fileMB} MB). Maximum autorisé : ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const error = validate(file);
    if (error) {
      setState({ status: "error", message: error });
      return;
    }

    const format: AudioFormat = ACCEPTED_TYPES[file.type] ?? "mp3";
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
        format,
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
        <span style={{ color: "var(--color-vert-energie)" }} className="text-sm font-medium">
          ✓ Fichier audio envoyé
          {state.durationSeconds > 0
            ? ` (${formatDuration(state.durationSeconds)})`
            : ""}
        </span>
        <button onClick={reset} className="text-xs underline" style={{ color: "var(--color-texte-secondaire)" }}>
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
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
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
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-bordure)" }}
        >
          {/* Icône audio */}
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
              {state.durationSeconds > 0
                ? ` · ${formatDuration(state.durationSeconds)}`
                : ""}
            </p>

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-2">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-bordure)" }}
                >
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
          MP3 · WAV · M4A — max {MAX_SIZE_MB} MB
        </p>
      </div>

      {/* Message d'erreur */}
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
