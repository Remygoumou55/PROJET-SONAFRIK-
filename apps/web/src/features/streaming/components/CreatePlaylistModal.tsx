"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_LIMITS } from "@sonafrik/shared";
import { PlaylistPrivacyToggle } from "@/components/playlist/PlaylistPrivacyToggle";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description?: string, isPublic?: boolean) => Promise<void>;
}

export function CreatePlaylistModal({ isOpen, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus automatique et reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fermeture par Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError("Le nom de la playlist est requis.");
        return;
      }
      if (trimmedTitle.length > FIELD_LIMITS.PLAYLIST_TITLE) {
        setError(`Le nom ne doit pas dépasser ${FIELD_LIMITS.PLAYLIST_TITLE} caractères.`);
        return;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        await onCreate(
          trimmedTitle,
          description.trim() || undefined,
          isPublic,
        );
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de créer la playlist.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, description, isPublic, onCreate, onClose],
  );

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panneau */}
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-texte-principal)" }}>
            Nouvelle playlist
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-texte-secondaire)" }}>
              Nom <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ma playlist…"
              maxLength={FIELD_LIMITS.PLAYLIST_TITLE}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: "var(--color-elevated)",
                border: "1px solid var(--color-bordure)",
                color: "var(--color-texte-principal)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--color-vert-energie)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--color-bordure)"; }}
            />
            <div className="flex justify-end">
              <span
                className="text-xs"
                style={{ color: title.length > FIELD_LIMITS.PLAYLIST_TITLE * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
              >
                {title.length}/{FIELD_LIMITS.PLAYLIST_TITLE}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-texte-secondaire)" }}>
              Description <span style={{ color: "var(--color-texte-desactive)" }}>(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre playlist…"
              rows={3}
              maxLength={FIELD_LIMITS.PLAYLIST_DESCRIPTION}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
              style={{
                backgroundColor: "var(--color-elevated)",
                border: "1px solid var(--color-bordure)",
                color: "var(--color-texte-principal)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--color-vert-energie)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--color-bordure)"; }}
            />
            <div className="flex justify-end">
              <span
                className="text-xs"
                style={{ color: description.length > FIELD_LIMITS.PLAYLIST_DESCRIPTION * 0.85 ? "var(--color-or-solaire)" : "var(--color-texte-desactive)" }}
              >
                {description.length}/{FIELD_LIMITS.PLAYLIST_DESCRIPTION}
              </span>
            </div>
          </div>

          {/* Visibilité */}
          <PlaylistPrivacyToggle isPublic={isPublic} onChange={setIsPublic} />

          {/* Erreur */}
          {error && (
            <p className="text-xs px-1" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || title.trim().length === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity"
              style={{
                backgroundColor: "var(--color-vert-energie)",
                color: "var(--color-noir-profond)",
                opacity: isSubmitting || title.trim().length === 0 ? 0.5 : 1,
              }}
            >
              {isSubmitting ? "Création…" : "Créer la playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
