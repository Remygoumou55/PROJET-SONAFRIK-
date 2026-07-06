/** SONAFRIK — Default catalog cover generation (Cover Engine v1.0) */

export const DEFAULT_ARTWORK_SIZE = 1400;

export type DefaultArtworkInput = {
  trackTitle: string;
  artistName: string;
  size?: number;
};

export type DefaultArtworkResult = {
  blob: Blob;
  contentType: "image/jpeg";
  width: number;
  height: number;
};

/** Album metadata key — technical cover origin (user | auto). */
export const COVER_SOURCE_METADATA_KEY = "cover_source";
export type CoverSource = "user" | "auto";

function truncate(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

/**
 * Generates a branded default cover (browser only — uses Canvas).
 * Identity: fond noir SONAFRIK, accent vert, logo texte, titre + artiste.
 */
export async function generateDefaultArtwork(
  input: DefaultArtworkInput,
): Promise<DefaultArtworkResult> {
  if (typeof document === "undefined") {
    throw new Error("generateDefaultArtwork requires a browser environment.");
  }

  const size = input.size ?? DEFAULT_ARTWORK_SIZE;
  const title = truncate(input.trackTitle || "Sans titre", 48);
  const artist = truncate(input.artistName || "Artiste", 40);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponible.");

  // Design tokens (globals.css)
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, size, size);

  const margin = Math.round(size * 0.08);
  ctx.fillStyle = "#00d26a";
  ctx.fillRect(margin, margin, Math.round(size * 0.12), 6);

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = `700 ${Math.round(size * 0.055)}px Montserrat, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("SONAFRIK", margin, margin + Math.round(size * 0.04));

  ctx.fillStyle = "#ffc20e";
  ctx.font = `600 ${Math.round(size * 0.028)}px Montserrat, system-ui, sans-serif`;
  ctx.fillText("Pochette automatique", margin, margin + Math.round(size * 0.14));

  const textMaxWidth = size - margin * 2;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(size * 0.065)}px Montserrat, system-ui, sans-serif`;
  const titleLines = wrapLines(ctx, title, textMaxWidth, 3);
  let y = size * 0.42;
  for (const line of titleLines) {
    ctx.fillText(line, margin, y);
    y += Math.round(size * 0.075);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = `500 ${Math.round(size * 0.038)}px Montserrat, system-ui, sans-serif`;
  ctx.fillText(artist, margin, Math.min(y + Math.round(size * 0.04), size - margin - Math.round(size * 0.08)));

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Échec de génération de la pochette automatique."))),
      "image/jpeg",
      0.92,
    );
  });

  return { blob, contentType: "image/jpeg", width: size, height: size };
}
