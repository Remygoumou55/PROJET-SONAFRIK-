import { mimeToUploadFormat } from "@sonafrik/shared";

export type AudioFormat = "mp3" | "aac" | "wav";

export type UploadState =
  | { status: "idle" }
  | { status: "analyzing"; fileName: string }
  | { status: "ready"; file: File; durationSeconds: number; format: AudioFormat }
  | { status: "uploading"; file: File; durationSeconds: number; format: AudioFormat; progress: number }
  | { status: "validating"; fileName: string }
  | { status: "success"; durationSeconds: number }
  | { status: "error"; message: string };

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function resolveFormatFromFile(file: File): AudioFormat | null {
  const byMime = mimeToUploadFormat(file.type);
  if (byMime) {
    if (byMime === "mp3") return "mp3";
    if (byMime === "wav") return "wav";
    return "aac"; // m4a → "aac" (DB backward compat)
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp3") return "mp3";
  if (ext === "wav") return "wav";
  if (ext === "m4a") return "aac";
  return null;
}

// Uses HTML5 audio metadata — never decodes the audio signal (no RAM expansion)
export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    };
    audio.onerror = () => {
      reject(new Error("Lecture des métadonnées audio impossible. Vérifiez que le fichier est un MP3, M4A ou WAV valide."));
    };
    audio.src = url;
  });
}
