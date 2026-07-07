type ModuleWithDefault<T> = { default: T };

/**
 * Retry dynamic import — évite ChunkLoadError après clean .next ou HMR en dev.
 * Recharge la page une fois si le chunk reste introuvable.
 */
export function dynamicImportWithRetry<T>(
  loader: () => Promise<ModuleWithDefault<T>>,
  retries = 2,
): () => Promise<ModuleWithDefault<T>> {
  return async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await loader();
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        const isChunkError =
          (err instanceof Error && err.name === "ChunkLoadError") ||
          message.includes("Loading chunk") ||
          message.includes("Failed to fetch dynamically imported module");

        if (!isChunkError) throw err;

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
          continue;
        }

        if (typeof window !== "undefined") {
          const key = "sonafrik-chunk-reload";
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            window.location.reload();
            return new Promise(() => undefined as never);
          }
          sessionStorage.removeItem(key);
        }

        throw err;
      }
    }

    throw lastError;
  };
}
