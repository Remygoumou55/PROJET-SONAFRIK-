"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  mimeToUploadFormat,
  sha256Hex,
  validateAudioAsset,
  MAX_UPLOAD_BYTES,
} from "@sonafrik/shared";
import { useCatalogService } from "../hooks/useCatalog";

type AudioFormat = "mp3" | "aac";

const ACCEPTED_EXTENSIONS = ".mp3,.m4a";
const MAX_SIZE_MB = 50;

// ─── Public handle ────────────────────────────────────────────────────────────

export interface AudioUploaderHandle {
  triggerUpload: () => Promise<void>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  trackId: string;
  creatorId: string;
  onFileReady?: () => void;
  onFileCleared?: () => void;
  onSuccess?: (durationSeconds: number) => void;
}

// ─── State machine ────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "analyzing"; fileName: string }
  | { status: "ready"; file: File; durationSeconds: number; format: AudioFormat }
  | { status: "uploading"; file: File; durationSeconds: number; format: AudioFormat; progress: number }
  | { status: "validating"; fileName: string }
  | { status: "success"; durationSeconds: number }
  | { status: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

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

// Uses HTML5 audio metadata — never decodes the audio signal (no RAM expansion)
function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    };
    audio.onerror = () => {
      reject(new Error("Lecture des métadonnées audio impossible. Vérifiez que le fichier est un MP3 ou M4A valide."));
    };
    audio.src = url;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AudioUploader = forwardRef<AudioUploaderHandle, Props>(function AudioUploader(
  { trackId, creatorId, onFileReady, onFileCleared, onSuccess },
  ref,
) {
  const catalog = useCatalogService();
  const inputRef = useRef<HTMLInputElement>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<UploadState>({ status: "idle" });
  const stateRef = useRef(state);
  stateRef.current = state;

  const [isDragOver, setIsDragOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    return () => { if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); };
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = useCallback(async (file: File): Promise<string | null> => {
    const format = resolveFormatFromFile(file);
    if (!format) return "Format non supporté. Choisissez un fichier MP3 ou M4A.";
    if (file.size === 0) return "Fichier vide.";
    if (file.size > MAX_UPLOAD_BYTES) {
      return `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : ${MAX_SIZE_MB} MB.`;
    }
    const header = new Uint8Array(await file.slice(0, 512).arrayBuffer());
    const effectiveMime = resolveEffectiveMime(file);
    const precheck = validateAudioAsset({ header, mime: effectiveMime, fileSizeBytes: file.size, dbFormat: format === "mp3" ? "mp3" : "aac" });
    if (precheck.status === "invalid" || precheck.status === "needs_review") return precheck.message;
    return null;
  }, []);

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setState({ status: "analyzing", fileName: file.name });
    const error = await validate(file);
    if (error) { setState({ status: "error", message: error }); return; }

    const format: AudioFormat = resolveFormatFromFile(file) ?? "mp3";
    try {
      // Create objectURL once — reused by duration detection AND the audio player
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(file);
      audioUrlRef.current = url;

      const durationSeconds = await getAudioDuration(url);
      if (durationSeconds <= 0) {
        URL.revokeObjectURL(url);
        audioUrlRef.current = null;
        setState({ status: "error", message: "Durée audio invalide ou fichier corrompu." });
        return;
      }

      setState({ status: "ready", file, durationSeconds, format });
      setPlaying(false);
      setCurrentTime(0);
      onFileReady?.();
    } catch (err) {
      if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
      const msg = err instanceof Error ? err.message : "Impossible de lire ce fichier.";
      setState({ status: "error", message: msg });
    }
  }, [validate, onFileReady]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  // ── Upload ───────────────────────────────────────────────────────────────────

  const doUpload = useCallback(async (file: File, durationSeconds: number, format: AudioFormat): Promise<void> => {
    setState({ status: "uploading", file, durationSeconds, format, progress: 0 });
    try {
      const effectiveMime = resolveEffectiveMime(file);
      const { signedUrl, path } = await catalog.requestAssetUploadUrl({ creatorId, assetType: "audio", contentType: effectiveMime, trackId, format });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", effectiveMime);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setState((prev) => prev.status === "uploading" ? { ...prev, progress: Math.round((ev.loaded / ev.total) * 100) } : prev);
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Erreur serveur (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Connexion perdue pendant l'envoi."));
        xhr.send(file);
      });

      setState({ status: "validating", fileName: file.name });
      const contentHash = await sha256Hex(await file.arrayBuffer());
      // Use effectiveMime (normalized) — file.type may be "" for drag-dropped files
      const confirm = await catalog.confirmAssetUpload({ creatorId, trackId, path, format, contentType: effectiveMime, fileSizeBytes: file.size, durationSeconds: Math.round(durationSeconds), contentHash });
      if (confirm.integrityStatus === "invalid") throw new Error(confirm.message || "Fichier rejeté après validation serveur.");

      setState({ status: "success", durationSeconds });
      onSuccess?.(Math.round(durationSeconds));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi du fichier audio.";
      setState({ status: "error", message: msg });
      throw new Error(msg);
    }
  }, [catalog, creatorId, trackId, onSuccess]);

  // ── Imperative handle ─────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    triggerUpload: async () => {
      const s = stateRef.current;
      if (s.status === "success") return;
      if (s.status !== "ready") throw new Error("Aucun fichier audio sélectionné.");
      await doUpload(s.file, s.durationSeconds, s.format);
    },
  }), [doUpload]);

  // ── Reset ────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    if (audioElRef.current) audioElRef.current.pause();
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    setPlaying(false);
    setCurrentTime(0);
    setState({ status: "idle" });
    onFileCleared?.();
  }, [onFileCleared]);

  // ── Player controls ───────────────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  }, [playing]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioElRef.current;
    const s = stateRef.current;
    if (!el || (s.status !== "ready" && s.status !== "uploading")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - rect.left) / rect.width) * s.durationSeconds;
  }, []);

  // ── Success ───────────────────────────────────────────────────────────────────

  if (state.status === "success") {
    return (
      <div className="audio-up__success">
        <span className="audio-up__success-icon">✓</span>
        <span className="audio-up__success-text">
          Audio validé{state.durationSeconds > 0 ? ` — ${formatDuration(state.durationSeconds)}` : ""}
        </span>
      </div>
    );
  }

  // ── Analyzing / Validating ────────────────────────────────────────────────────

  if (state.status === "analyzing" || state.status === "validating") {
    return (
      <div className="audio-up__analyzing">
        <div className="audio-up__spinner" aria-hidden="true" />
        <span>{state.status === "analyzing" ? "Analyse du fichier…" : "Validation serveur…"}</span>
      </div>
    );
  }

  // ── Ready / Uploading — lecteur intégré ──────────────────────────────────────

  if (state.status === "ready" || state.status === "uploading") {
    const isUploading = state.status === "uploading";
    const progress = isUploading ? state.progress : 0;
    const seekPct = state.durationSeconds > 0 ? (currentTime / state.durationSeconds) * 100 : 0;

    return (
      <div className="audio-up__player">
        <audio
          ref={audioElRef}
          src={audioUrlRef.current ?? undefined}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => setPlaying(false)}
          preload="none"
        />

        {/* File info */}
        <div className="audio-up__info">
          <p className="audio-up__name">{state.file.name}</p>
          <p className="audio-up__meta">
            {state.format.toUpperCase()}&thinsp;·&thinsp;{formatBytes(state.file.size)}&thinsp;·&thinsp;{formatDuration(state.durationSeconds)}
          </p>
        </div>

        {/* Controls */}
        <div className="audio-up__controls">
          <button
            className="audio-up__play-btn"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Écouter le morceau"}
            disabled={isUploading}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="2" y="1" width="4" height="12" rx="1" fill="currentColor" />
                <rect x="8" y="1" width="4" height="12" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 1.5L12.5 7L3 12.5V1.5Z" fill="currentColor" />
              </svg>
            )}
          </button>

          <div
            className="audio-up__seek"
            onClick={handleSeek}
            role="progressbar"
            aria-label="Avancement de la lecture"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(state.durationSeconds)}
            tabIndex={0}
            onKeyDown={(e) => {
              const el = audioElRef.current;
              if (!el) return;
              if (e.key === "ArrowRight") el.currentTime = Math.min(el.currentTime + 5, state.durationSeconds);
              if (e.key === "ArrowLeft") el.currentTime = Math.max(el.currentTime - 5, 0);
            }}
          >
            <div className="audio-up__seek-track">
              <div className="audio-up__seek-fill" style={{ width: `${seekPct}%` }} />
              <div className="audio-up__seek-thumb" style={{ left: `${seekPct}%` }} />
            </div>
          </div>

          <span className="audio-up__time" aria-live="off">
            {formatDuration(currentTime)}&thinsp;/&thinsp;{formatDuration(state.durationSeconds)}
          </span>
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div className="audio-up__upload-bar" aria-label={`Envoi : ${progress}%`}>
            <div className="audio-up__upload-track">
              <div className="audio-up__upload-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="audio-up__upload-pct">{progress}% envoyé…</span>
          </div>
        )}

        {!isUploading && (
          <button className="audio-up__change" onClick={reset}>
            Changer le fichier
          </button>
        )}
      </div>
    );
  }

  // ── Idle / Error — Drop zone ──────────────────────────────────────────────────

  return (
    <div className="audio-up__wrap">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`audio-up__drop${isDragOver ? " audio-up__drop--over" : ""}`}
        aria-label="Zone de dépôt du fichier audio"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="4" y="10" width="24" height="16" rx="3" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
          <circle cx="10" cy="18" r="2.5" stroke="var(--color-texte-desactive)" strokeWidth="1.5" />
          <path d="M13 18h9" stroke="var(--color-texte-desactive)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 4v8M13 7l3-3 3 3" stroke="var(--color-vert-energie)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="audio-up__drop-label">Glissez un fichier ou cliquez</p>
        <p className="audio-up__drop-hint">MP3 · M4A — max {MAX_SIZE_MB} MB</p>
      </div>

      {state.status === "error" && (
        <p className="audio-up__error" role="alert">{state.message}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleInputChange}
      />
    </div>
  );
});
