"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GENRE_OPTIONS } from "@sonafrik/types";
import { useRightsService } from "../hooks/useRightsService";

interface Props {
  creatorId: string;
  onCancel: () => void;
}

export function CreateWorkForm({ creatorId, onCancel }: Props) {
  const router = useRouter();
  const rights = useRightsService();
  const [title, setTitle] = useState("");
  const [iswc, setIswc] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("fr");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setLoading(true);
    setError(null);
    try {
      const work = await rights.createWork({
        creatorId,
        title: title.trim(),
        iswc: iswc.trim() || undefined,
        genre: genre || undefined,
        language,
        description: description.trim() || undefined,
      });
      router.push(`/creator/rights/${work.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'œuvre.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--color-elevated)",
    border: "1px solid var(--color-bordure)",
    color: "var(--color-texte-principal)",
    borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem",
    width: "100%",
    fontSize: "0.875rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--color-texte-secondaire)",
    marginBottom: "0.375rem",
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-elevated)" }}
    >
      <h3 className="text-base font-bold mb-5" style={{ color: "var(--color-texte-principal)" }}>
        Nouvelle œuvre musicale
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label style={labelStyle}>Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nom de l'œuvre"
            style={inputStyle}
            maxLength={200}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Choisir —</option>
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Langue</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={inputStyle}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">Arabe</option>
              <option value="pt">Portugais</option>
              <option value="wo">Wolof</option>
              <option value="bm">Bambara</option>
              <option value="ff">Peul / Fula</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>ISWC (optionnel)</label>
          <input
            type="text"
            value={iswc}
            onChange={(e) => setIswc(e.target.value)}
            placeholder="T-xxx.xxx.xxx-x"
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
            International Standard Musical Work Code
          </p>
        </div>

        <div>
          <label style={labelStyle}>Description (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes sur l'œuvre, contexte, etc."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            maxLength={1000}
          />
        </div>

        {error && (
          <p
            className="text-xs px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(255,68,68,0.09)", color: "var(--color-erreur)" }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
          >
            {loading ? "Création…" : "Créer l'œuvre"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
