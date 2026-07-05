// Moteur d'upload centralisé — XHR + progress + retry exponentiel.
// Browser-only (XHR, Blob). Utilisé par CatalogService et les composants web.

type UploadErrorCode = "network" | "permission" | "server" | "unknown";

const USER_MESSAGES: Record<UploadErrorCode, string> = {
  network:    "Votre connexion semble instable. Réessayez dans quelques instants.",
  permission: "Vous n'avez pas l'autorisation d'enregistrer ce fichier.",
  server:     "Impossible d'enregistrer votre fichier. Réessayez dans quelques instants.",
  unknown:    "Impossible d'enregistrer votre fichier. Réessayez.",
};

export class AssetUploadError extends Error {
  readonly code: UploadErrorCode;
  constructor(code: UploadErrorCode) {
    super(USER_MESSAGES[code]);
    this.code = code;
    this.name = "AssetUploadError";
  }
}

export type UploadAssetOptions = {
  contentType: string;
  onProgress?: (pct: number) => void;
  maxRetries?: number;
  token?: string;
};

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function codeFromStatus(status: number): UploadErrorCode {
  if (status === 401 || status === 403) return "permission";
  if (status >= 400 && status < 500) return "unknown";
  return "server";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function xhrPut(signedUrl: string, file: Blob, options: UploadAssetOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", options.contentType);
    if (options.token) xhr.setRequestHeader("x-upsert", "true");
    xhr.timeout = 120_000;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        resolve();
      } else {
        reject({ status: xhr.status, isNetwork: false });
      }
    };

    xhr.onerror  = () => reject({ status: 0, isNetwork: true });
    xhr.ontimeout = () => reject({ status: 0, isNetwork: true });
    xhr.send(file);
  });
}

export async function uploadAssetToSignedUrl(
  signedUrl: string,
  file: Blob,
  options: UploadAssetOptions,
): Promise<void> {
  const maxRetries = options.maxRetries ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await xhrPut(signedUrl, file, options);
      return;
    } catch (raw) {
      const err = raw as { status: number; isNetwork: boolean };
      const isLast = attempt >= maxRetries;

      if (err.isNetwork || isRetryable(err.status)) {
        if (!isLast) {
          await sleep(1000 * Math.pow(2, attempt)); // 1s → 2s
          continue;
        }
        throw new AssetUploadError(err.isNetwork ? "network" : "server");
      }

      throw new AssetUploadError(codeFromStatus(err.status));
    }
  }
}
