"use client";

import { IMAGE_POLICY, isImage, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";

export const AUTO_IMAGE_VARIANTS = {
  hero: "hero",
  avatar: "avatar",
  squareCover: "square-cover",
} as const;

export type AutoImageVariant = (typeof AUTO_IMAGE_VARIANTS)[keyof typeof AUTO_IMAGE_VARIANTS];

export type AutoImagePrepared = {
  file: File;
  contentType: ImageMime;
  width: number;
  height: number;
};

type CropRegion = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

type VariantConfig = {
  aspectRatio: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  minQuality: number;
  focalY: number;
};

const VARIANT_CONFIG: Record<AutoImageVariant, VariantConfig> = {
  hero: {
    aspectRatio: 16 / 9,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.88,
    minQuality: 0.48,
    focalY: 0.45,
  },
  avatar: {
    aspectRatio: 1,
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.9,
    minQuality: 0.52,
    focalY: 0.5,
  },
  "square-cover": {
    aspectRatio: 1,
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.88,
    minQuality: 0.48,
    focalY: 0.44,
  },
};

function validateImageFile(file: File): void {
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!isImage(file.type) && !extOk) {
    throw new Error("Format non supporté. Utilisez JPG, PNG ou WebP.");
  }
  if (file.size > IMAGE_POLICY.maxBytes) {
    throw new Error(`Image trop lourde. Maximum ${IMAGE_POLICY.maxLabel}.`);
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de traiter cette image."));
    };
    image.src = url;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function drawCoverCanvas(
  image: HTMLImageElement,
  config: VariantConfig,
): HTMLCanvasElement {
  const crop = computeCropRegion(image.naturalWidth, image.naturalHeight, config);
  const canvas = document.createElement("canvas");
  canvas.width = config.maxWidth;
  canvas.height = config.maxHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de traiter cette image.");

  ctx.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    config.maxWidth,
    config.maxHeight,
  );

  return canvas;
}

/** Carré avatar — image entière visible, centrée (pas de crop tête uniquement). */
function drawAvatarCanvas(
  image: HTMLImageElement,
  config: VariantConfig,
): HTMLCanvasElement {
  const size = config.maxWidth;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de traiter cette image.");

  ctx.fillStyle = "rgb(13 13 13)";
  ctx.fillRect(0, 0, size, size);

  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  return canvas;
}

function computeCropRegion(
  sourceWidth: number,
  sourceHeight: number,
  config: VariantConfig,
): CropRegion {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = config.aspectRatio;

  let sw = sourceWidth;
  let sh = sourceHeight;
  let sx = 0;
  let sy = 0;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = sourceWidth / targetRatio;
    sy = clamp(sourceHeight * config.focalY - sh / 2, 0, sourceHeight - sh);
  }

  return { sx, sy, sw, sh };
}

function blobFromCanvas(
  canvas: HTMLCanvasElement,
  contentType: ImageMime,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Impossible de générer cette image."))),
      contentType,
      quality,
    );
  });
}

export async function prepareAutoImage(
  file: File,
  variant: AutoImageVariant,
): Promise<AutoImagePrepared> {
  validateImageFile(file);

  const config = VARIANT_CONFIG[variant];
  const image = await loadImage(file);

  if (variant === AUTO_IMAGE_VARIANTS.hero) {
    const canvas = drawCoverCanvas(image, config);
    const contentType = (resolveImageUploadMime(file) ?? "image/jpeg") as ImageMime;
    let quality = config.quality;
    let blob = await blobFromCanvas(canvas, contentType, quality);

    while (blob.size > IMAGE_POLICY.maxBytes && quality > config.minQuality) {
      quality -= 0.08;
      blob = await blobFromCanvas(canvas, contentType, quality);
    }

    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return {
      file: new File([blob], `${baseName}.${ext}`, { type: contentType, lastModified: Date.now() }),
      contentType,
      width: canvas.width,
      height: canvas.height,
    };
  }

  if (variant === AUTO_IMAGE_VARIANTS.avatar) {
    const canvas = drawAvatarCanvas(image, config);
    const contentType = (resolveImageUploadMime(file) ?? "image/jpeg") as ImageMime;
    let quality = config.quality;
    let blob = await blobFromCanvas(canvas, contentType, quality);

    while (blob.size > IMAGE_POLICY.maxBytes && quality > config.minQuality) {
      quality -= 0.08;
      blob = await blobFromCanvas(canvas, contentType, quality);
    }

    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return {
      file: new File([blob], `${baseName}.${ext}`, { type: contentType, lastModified: Date.now() }),
      contentType,
      width: canvas.width,
      height: canvas.height,
    };
  }

  const crop = computeCropRegion(image.naturalWidth, image.naturalHeight, config);
  const scale = Math.min(1, config.maxWidth / crop.sw, config.maxHeight / crop.sh);
  const width = Math.max(1, Math.round(crop.sw * scale));
  const height = Math.max(1, Math.round(crop.sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de traiter cette image.");

  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

  const contentType = (resolveImageUploadMime(file) ?? "image/jpeg") as ImageMime;
  let quality = config.quality;
  let blob = await blobFromCanvas(canvas, contentType, quality);

  while (blob.size > IMAGE_POLICY.maxBytes && quality > config.minQuality) {
    quality -= 0.08;
    blob = await blobFromCanvas(canvas, contentType, quality);
  }

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  return {
    file: new File([blob], `${baseName}.${ext}`, { type: contentType, lastModified: Date.now() }),
    contentType,
    width,
    height,
  };
}
