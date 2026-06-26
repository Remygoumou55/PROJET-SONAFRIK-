import { describe, expect, it } from "vitest";
import {
  detectContainerFromBytes,
  isMimeConsistentWithContainer,
  isUploadSizeValid,
  isWebPlaybackFormat,
  mimeToUploadFormat,
  STREAM_SIGNED_URL_TTL_SEC,
} from "./audio-pipeline-policy";

describe("audio-pipeline-policy", () => {
  it("accepte MP3/M4A upload MIME", () => {
    expect(mimeToUploadFormat("audio/mpeg")).toBe("mp3");
    expect(mimeToUploadFormat("audio/x-m4a")).toBe("aac");
    expect(mimeToUploadFormat("audio/wav")).toBeNull();
  });

  it("valide taille upload", () => {
    expect(isUploadSizeValid(1024)).toBe(true);
    expect(isUploadSizeValid(51 * 1024 * 1024)).toBe(false);
  });

  it("détecte en-têtes MP3 ID3", () => {
    const id3 = new Uint8Array([0x49, 0x44, 0x33, 0x04]);
    expect(detectContainerFromBytes(id3)).toBe("mp3");
  });

  it("détecte en-têtes M4A ftyp", () => {
    const ftyp = new Uint8Array([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70]);
    expect(detectContainerFromBytes(ftyp)).toBe("m4a");
  });

  it("détecte WAV RIFF", () => {
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(detectContainerFromBytes(wav)).toBe("wav");
  });

  it("rejette conteneur inconnu", () => {
    expect(detectContainerFromBytes(new Uint8Array([0, 0, 0, 0]))).toBe("unknown");
  });

  it("vérifie cohérence MIME/conteneur", () => {
    expect(isMimeConsistentWithContainer("audio/mpeg", "mp3")).toBe(true);
    expect(isMimeConsistentWithContainer("audio/mpeg", "wav")).toBe(false);
  });

  it("formats web playback", () => {
    expect(isWebPlaybackFormat("mp3")).toBe(true);
    expect(isWebPlaybackFormat("wav")).toBe(false);
  });

  it("TTL stream-start documenté", () => {
    expect(STREAM_SIGNED_URL_TTL_SEC).toBe(1800);
  });
});
