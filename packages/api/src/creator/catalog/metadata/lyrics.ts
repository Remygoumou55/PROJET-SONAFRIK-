import type { LyricLine } from "@sonafrik/types";

/** Convertit du texte brut wizard en lignes (timestamps espacés pour ordre d'affichage). */
export function plainLyricsToLines(text: string): LyricLine[] {
  const chunks = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return chunks.map((lineText, index) => ({
    time: index * 0.01,
    text: lineText,
  }));
}

export function linesToPlainLyrics(lines: LyricLine[]): string {
  return lines.map((line) => line.text).join("\n");
}
