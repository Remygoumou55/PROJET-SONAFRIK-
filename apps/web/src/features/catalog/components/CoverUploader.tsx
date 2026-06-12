"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useCatalogService } from "../hooks/useCatalog";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_SIZE_LABEL = "5 Mo";

interface Props {
  albumId: string;
  creatorId: string;
  onSuccess?: () => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; previewUrl: string }
  | { status: "uploading"; file: File; previewUrl: string; progress: number }
  | { status: "success" }
  | { status: "error"; message: string };

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function CoverUploader({ albumId, creatorId, onSuccess }: Props) {
  const catalog = useCatalogService();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Format non accepté. Utilisez JPEG, PNG ou WebP.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Fichier trop lourd (${formatBytes(file.size)}). Maximum ${MAX_SIZE_LABEL}.`;
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const error = validate(file);
    if (error) {
      setState({ status: "error", message: error });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setState({ status: "preview", file, previewUrl });
  }, [validate]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // reset pour permettre re-sélection du même fichier
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const uploadFile = useCallback(async () => {
    if (state.status !== "preview") return;
    const { file, previewUrl } = state;

    setState({ status: "uploading", file, previewUrl, progress: 0 });

    try {
      const { signedUrl } = await catalog.requestAssetUploadUrl({
        creatorId,
        assetType: "cover",
        contentType: file.type,
        albumId,
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setState((prev) =>
              prev.status === "uploading" ? { ...prev, progress: pct } : prev,
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Erreur serveur (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Connexion perdue pendant l'envoi."));
        xhr.send(file);
      });

      URL.revokeObjectURL(previewUrl);
      setState({ status: "success" });
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi de la pochette.";
      setState({ status: "error", message: msg });
    }
  }, [state, catalog, creatorId, albumId, onSuccess]);

  const reset = useCallback(() => {
    if (state.status === "preview" || state.status === "uploading") {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({ status: "idle" });
  }, [state]);

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (state.status === "success") {
    return (
      <div className="flex items-center gap-2">
        <span style={{ color: "#00D26A" }} className="text-sm font-medium">
          ✓ Pochette mise à jour
        </span>
        <button
          onClick={reset}
          className="text-xs underline"
          style={{ color: "#A0A0A0" }}
        >
          Changer
        </button>
      </div>
    );
  }

  if (state.status === "preview" || state.status === "uploading") {
    const isUploading = state.status === "uploading";
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          {/* Preview */}
          <Image
            src={state.previewUrl}
            alt="Aperçu de la pochette"
            width={80}
            height={80}
            unoptimized
            className="w-20 h-20 rounded-lg object-cover"
            style={{ border: "1px solid #333333" }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
              {state.file.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#A0A0A0" }}>
              {formatBytes(state.file.size)}
            </p>

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-2">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "#333333" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${state.progress}%`,
                      backgroundColor: "#00D26A",
                    }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: "#A0A0A0" }}>
                  {state.progress}% envoyé…
                </p>
              </div>
            )}
          </div>
        </div>

        {!isUploading && (
          <div className="flex gap-2">
            <button
              onClick={uploadFile}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
            >
              Envoyer la pochette
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0" }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Zone drag-and-drop */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-2 rounded-xl p-6 cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${isDragOver ? "#00D26A" : "#333333"}`,
          backgroundColor: isDragOver ? "#001a0d" : "#1A1A1A",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="18" rx="3" stroke="#555555" strokeWidth="1.5" />
          <circle cx="11" cy="14" r="2" stroke="#555555" strokeWidth="1.5" />
          <path d="M4 22l7-5 5 4 4-3 8 5" stroke="#555555" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 4v8M13 7l3-3 3 3" stroke="#00D26A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
          Glissez une image ou cliquez pour choisir
        </p>
        <p className="text-xs" style={{ color: "#555555" }}>
          JPEG · PNG · WebP — max {MAX_SIZE_LABEL}
        </p>
      </div>

      {/* Message d'erreur */}
      {state.status === "error" && (
        <p className="text-xs px-1" style={{ color: "#FF4444" }}>
          {state.message}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
