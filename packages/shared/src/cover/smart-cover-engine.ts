import { IMAGE_POLICY } from "../upload/upload-policy/constants";
import { isImage } from "../upload/upload-policy/helpers";
import { SMART_COVER_MESSAGES } from "./smart-cover-messages";

/** Dimensions catalogue SONAFRIK — alignées Cover Engine v1.0 */
export const SMART_COVER_MIN_DIMENSION = 1400;
export const SMART_COVER_RECOMMENDED = 3000;
export const SMART_COVER_OUTPUT_MAX_PX = 1920;
export const SMART_COVER_VERY_SMALL = 800;

export type SmartCoverOrientation = "square" | "portrait" | "landscape";

export type SmartCoverResult = {
  file: File;
  width: number;
  height: number;
  orientation: SmartCoverOrientation;
  /** Message non bloquant affiché à l'utilisateur */
  advisory: string | null;
  /** true si recadrage/compression automatiques appliqués */
  wasOptimized: boolean;
};

export class SmartCoverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmartCoverError";
  }
}

/** Détection orientation — testable sans canvas. */
export function detectSmartCoverOrientation(
  width: number,
  height: number,
): SmartCoverOrientation {
  if (width <= 0 || height <= 0) return "square";
  const ratio = width / height;
  if (ratio > 1.05) return "landscape";
  if (ratio < 0.95) return "portrait";
  return "square";
}

/** Recadrage carré centré — testable sans canvas. */
export function computeCenterSquareCrop(
  sourceWidth: number,
  sourceHeight: number,
): { sx: number; sy: number; side: number } {
  const side = Math.min(sourceWidth, sourceHeight);
  return {
    sx: (sourceWidth - side) / 2,
    sy: (sourceHeight - side) / 2,
    side,
  };
}

export function resolveSmartCoverAdvisory(
  width: number,
  height: number,
): { advisory: string | null; wasOptimized: boolean } {
  const minDim = Math.min(width, height);
  if (minDim < SMART_COVER_VERY_SMALL) {
    return { advisory: SMART_COVER_MESSAGES.smallCompatible, wasOptimized: true };
  }
  if (minDim < SMART_COVER_MIN_DIMENSION) {
    return { advisory: SMART_COVER_MESSAGES.smallCompatible, wasOptimized: true };
  }
  if (minDim < SMART_COVER_RECOMMENDED) {
    return { advisory: SMART_COVER_MESSAGES.optimized, wasOptimized: true };
  }
  return { advisory: SMART_COVER_MESSAGES.optimized, wasOptimized: true };
}

function assertBrowser(): void {
  if (typeof document === "undefined") {
    throw new SmartCoverError("SmartCoverEngine requires a browser environment.");
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new SmartCoverError(SMART_COVER_MESSAGES.qualityFailed));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) =>
        blob ? resolve(blob) : reject(new SmartCoverError(SMART_COVER_MESSAGES.qualityFailed)),
      "image/jpeg",
      quality,
    );
  });
}

async function renderSquareCover(
  img: HTMLImageElement,
  crop?: { sx: number; sy: number; side: number },
): Promise<{ blob: Blob; width: number; height: number }> {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (sw <= 0 || sh <= 0) {
    throw new SmartCoverError(SMART_COVER_MESSAGES.qualityFailed);
  }

  const region = crop ?? computeCenterSquareCrop(sw, sh);
  const scale = Math.min(1, SMART_COVER_OUTPUT_MAX_PX / region.side);
  const outputSize = Math.max(1, Math.round(region.side * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new SmartCoverError(SMART_COVER_MESSAGES.qualityFailed);

  ctx.drawImage(
    img,
    region.sx,
    region.sy,
    region.side,
    region.side,
    0,
    0,
    outputSize,
    outputSize,
  );

  let quality = 0.88;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > IMAGE_POLICY.maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToJpegBlob(canvas, quality);
  }

  return { blob, width: outputSize, height: outputSize };
}

function validateCoverFile(file: File): void {
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!isImage(file.type) && !extOk) {
    throw new SmartCoverError(SMART_COVER_MESSAGES.formatUnsupported);
  }
  if (file.size > IMAGE_POLICY.maxBytes) {
    throw new SmartCoverError(SMART_COVER_MESSAGES.fileTooLarge(IMAGE_POLICY.maxLabel));
  }
}

function toCoverFile(blob: Blob, baseName: string): File {
  return new File([blob], `${baseName.replace(/\.[^.]+$/, "") || "cover"}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Automatic Processing Engine — Smart Cover Engine
 * Analyse → recadrage intelligent centré → compression → sortie carrée.
 */
export class SmartCoverEngine {
  /** Parcours par défaut : aucun popup, traitement automatique complet. */
  static async processAutomatic(file: File): Promise<SmartCoverResult> {
    assertBrowser();
    validateCoverFile(file);

    const img = await loadImageFromFile(file);
    const orientation = detectSmartCoverOrientation(img.naturalWidth, img.naturalHeight);
    const { blob, width, height } = await renderSquareCover(img);
    const { advisory, wasOptimized } = resolveSmartCoverAdvisory(
      img.naturalWidth,
      img.naturalHeight,
    );

    return {
      file: toCoverFile(blob, file.name),
      width,
      height,
      orientation,
      advisory,
      wasOptimized,
    };
  }

  /** Option avancée — après recadrage manuel (CatalogCropModal). */
  static async processManualCrop(croppedBlob: Blob, sourceName = "cover"): Promise<SmartCoverResult> {
    assertBrowser();
    const file = new File([croppedBlob], `${sourceName}.jpg`, { type: "image/jpeg" });
    validateCoverFile(file);

    const img = await loadImageFromFile(file);
    const { blob, width, height } = await renderSquareCover(img, {
      sx: 0,
      sy: 0,
      side: Math.min(img.naturalWidth, img.naturalHeight),
    });

    return {
      file: toCoverFile(blob, sourceName),
      width,
      height,
      orientation: detectSmartCoverOrientation(img.naturalWidth, img.naturalHeight),
      advisory: SMART_COVER_MESSAGES.optimized,
      wasOptimized: true,
    };
  }
}
