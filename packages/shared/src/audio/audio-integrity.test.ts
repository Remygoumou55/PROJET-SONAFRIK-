import { describe, expect, it } from "vitest";
import {
  detectContainerFromBytes,
  validateAudioAsset,
  MIN_BLOB_BYTES,
} from "./audio-integrity";

const MP3_HEADER = new Uint8Array([0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00]);

describe("audio-integrity", () => {
  it("détecte MP3", () => {
    expect(detectContainerFromBytes(MP3_HEADER)).toBe("mp3");
  });

  it("rejette stub < 64 octets", () => {
    const r = validateAudioAsset({
      header: MP3_HEADER,
      mime: "audio/mpeg",
      fileSizeBytes: 4,
      dbFormat: "mp3",
    });
    expect(r.status).toBe("invalid");
  });

  it("valide MP3 cohérent", () => {
    const r = validateAudioAsset({
      header: MP3_HEADER,
      mime: "audio/mpeg",
      fileSizeBytes: 1024 * 1024,
      dbFormat: "mp3",
    });
    expect(r.status).toBe("valid");
    expect(r.webCompatible).toBe(true);
  });

  it("valide WAV (lecture navigateur native)", () => {
    const wav = new Uint8Array(12);
    wav.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    const r = validateAudioAsset({
      header: wav,
      mime: "audio/wav",
      fileSizeBytes: MIN_BLOB_BYTES + 100,
      dbFormat: "wav",
    });
    expect(r.status).toBe("valid");
    expect(r.webCompatible).toBe(true);
  });
});
