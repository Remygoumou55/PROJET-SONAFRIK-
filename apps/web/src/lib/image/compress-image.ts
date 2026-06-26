/** Limites pour le téléversement d'images (client web). */
export const IMAGE_UPLOAD = {
  MAX_BYTES: 5 * 1024 * 1024,
  MAX_GALLERY_ITEMS: 12,
  PROFILE_MAX_PX: 800,
  COVER_MAX_PX: 1920,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export type AllowedImageMime = (typeof IMAGE_UPLOAD.ALLOWED_TYPES)[number];

export function isAllowedImageMime(type: string): type is AllowedImageMime {
  return (IMAGE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(type);
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
      reject(new Error("image_load_failed"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: AllowedImageMime,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) => (blob ? resolve(blob) : reject(new Error("canvas_blob_failed"))),
      type,
      quality,
    );
  });
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
  crop?: "square" | "cover";
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const {
    maxWidth = IMAGE_UPLOAD.COVER_MAX_PX,
    maxHeight = IMAGE_UPLOAD.COVER_MAX_PX,
    quality = 0.85,
    maxBytes = IMAGE_UPLOAD.MAX_BYTES,
    crop,
  } = options;

  const mime: AllowedImageMime = isAllowedImageMime(file.type) ? file.type : "image/jpeg";
  const img = await loadImageFromFile(file);

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (crop === "square") {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = side;
    sh = side;
  } else if (crop === "cover") {
    const targetRatio = 16 / 9;
    const sourceRatio = sw / sh;
    if (sourceRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
  }

  const scale = Math.min(1, maxWidth / sw, maxHeight / sh);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  let q = quality;
  let blob = await canvasToBlob(canvas, mime, q);

  while (blob.size > maxBytes && q > 0.45) {
    q -= 0.08;
    blob = await canvasToBlob(canvas, mime, q);
  }

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${ext}`, { type: mime, lastModified: Date.now() });
}

export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeImagePreviewUrl(url: string): void {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}
