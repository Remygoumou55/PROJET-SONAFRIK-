import { describe, expect, it } from "vitest";
import { linesToPlainLyrics, plainLyricsToLines } from "./lyrics";

describe("catalog metadata lyrics", () => {
  it("plainLyricsToLines — lignes ordonnées", () => {
    const lines = plainLyricsToLines("Première ligne\n\nDeuxième ligne");
    expect(lines).toHaveLength(2);
    expect(lines[0]?.text).toBe("Première ligne");
    expect(lines[1]?.text).toBe("Deuxième ligne");
    expect(lines[1]?.time).toBeGreaterThan(lines[0]?.time ?? 0);
  });

  it("linesToPlainLyrics — round-trip", () => {
    const text = "Alpha\nBeta";
    expect(linesToPlainLyrics(plainLyricsToLines(text))).toBe(text);
  });
});
