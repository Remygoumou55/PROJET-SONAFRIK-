"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioUploader } from "./AudioUploader";
import { CoverUploader } from "./CoverUploader";
import type { AudioUploaderHandle } from "./AudioUploader";
import type { CoverUploaderHandle } from "./CoverUploader";
import { useCatalogService } from "../hooks/useCatalog";
import type { Genre } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared/field-limits";
import { IMAGE_POLICY } from "@sonafrik/shared";

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

interface CreatedRelease {
  albumId: string;
  trackId: string;
  title: string;
}

interface MetadataForm {
  genreId: string;
  language: string;
  auteur: string;
  compositeur: string;
  producteur: string;
  releaseDate: string;
  explicit: boolean;
}

interface Props {
  creatorId: string;
  stageName: string;
  onComplete: () => void;
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "su", label: "Soussou" },
  { code: "ff", label: "Pular" },
  { code: "ma", label: "Malinké" },
  { code: "wo", label: "Wolof" },
  { code: "ha", label: "Haoussa" },
  { code: "dy", label: "Dioula" },
  { code: "ot", label: "Autres" },
];

const VERIF_ITEMS = [
  { label: "Fichier audio chargé", check: (ctx: ChecklistContext) => ctx.audioReady },
  { label: "Pochette chargée", check: (ctx: ChecklistContext) => ctx.coverReady },
  { label: "Genre sélectionné", check: (ctx: ChecklistContext) => Boolean(ctx.genreId) },
  { label: "Crédits renseignés", check: (ctx: ChecklistContext) => ctx.creditsReady },
  { label: "Date de sortie définie", check: (ctx: ChecklistContext) => Boolean(ctx.releaseDate) },
];

interface ChecklistContext {
  audioReady: boolean;
  coverReady: boolean;
  genreId: string;
  creditsReady: boolean;
  releaseDate: string;
}

const STEP_LABELS = ["Créer", "Fichiers", "Informations", "Publication"];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <nav className="pub-wiz__progress" aria-label="Étapes de publication">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as WizardStep;
        const status = n < step ? "done" : n === step ? "active" : "pending";
        return (
          <div key={n} className={`pub-wiz__step pub-wiz__step--${status}`}>
            <div className="pub-wiz__step-dot" aria-hidden="true">
              {status === "done" ? "✓" : n}
            </div>
            <span className="pub-wiz__step-label">{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`pub-wiz__step-line${status === "done" ? " pub-wiz__step-line--done" : ""}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Sidebar tips panel ───────────────────────────────────────────────────────

function TipsPanel({ tips }: { tips: { icon: string; text: string }[] }) {
  return (
    <aside className="pub-wiz__tips">
      <p className="pub-wiz__tips-title">💡 Conseils SONAFRIK</p>
      <ul className="pub-wiz__tips-list">
        {tips.map((t, i) => (
          <li key={i} className="pub-wiz__tips-item">
            <span className="pub-wiz__tips-icon" aria-hidden="true">{t.icon}</span>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ─── Step 3 — Publication checklist ───────────────────────────────────────────

function PublicationChecklist({ ctx }: { ctx: ChecklistContext }) {
  return (
    <div className="pub-wiz__verifs">
      <p className="pub-wiz__verifs-title">Checklist publication</p>
      <ul className="pub-wiz__verifs-list">
        {VERIF_ITEMS.map((item) => {
          const isDone = item.check(ctx);
          return (
            <li key={item.label} className={`pub-wiz__verif${isDone ? " pub-wiz__verif--done" : ""}`}>
              <span className="pub-wiz__verif-dot" aria-hidden="true">
                {isDone ? "✔" : "○"}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function PublicationWizard({ creatorId, stageName, onComplete, onCancel }: Props) {
  const catalog = useCatalogService();

  const [step, setStep] = useState<WizardStep>(1);
  const [release, setRelease] = useState<CreatedRelease | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [creating, setCreating] = useState(false);
  const audioRef = useRef<AudioUploaderHandle>(null);
  const coverRef = useRef<CoverUploaderHandle>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [coverReady, setCoverReady] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetadataForm>({
    genreId: "",
    language: "fr",
    auteur: stageName,
    compositeur: stageName,
    producteur: stageName,
    releaseDate: new Date().toISOString().split("T")[0] ?? "",
    explicit: false,
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checklistCtx: ChecklistContext = {
    audioReady,
    coverReady,
    genreId: meta.genreId,
    creditsReady: Boolean(meta.auteur.trim() && meta.compositeur.trim()),
    releaseDate: meta.releaseDate,
  };

  // Load genres when step 3 is active
  useEffect(() => {
    if (step !== 3) return;
    void catalog
      .getGenres()
      .then((list) => setGenres(list.filter((g) => g.is_active)))
      .catch(() => setError("Impossible de charger les genres. Réessayez."));
  }, [step, catalog]);

  // Load cover preview for step 4 summary
  useEffect(() => {
    if (step !== 4 || !release) return;
    let cancelled = false;
    void (async () => {
      try {
        const album = await catalog.getAlbum(release.albumId);
        if (!album.cover_path) return;
        const { signedUrl } = await catalog.requestCoverReadUrl({
          creatorId,
          path: album.cover_path,
        });
        if (!cancelled) setCoverPreviewUrl(signedUrl);
      } catch {
        if (!cancelled) setCoverPreviewUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [step, release, catalog, creatorId]);

  // ── Step 1 — Créer le morceau ──

  const handleCreateRelease = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim().length < 2) return;
    if (release) {
      setStep(2);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const album = await catalog.createAlbum({ title: titleInput.trim(), releaseType: "single" });
      const tracks = await catalog.listTracks(album.id);
      const autoTrack = tracks[0];
      if (!autoTrack) throw new Error("Morceau introuvable après création.");
      setRelease({ albumId: album.id, trackId: autoTrack.id, title: titleInput.trim() });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le morceau. Réessayez.");
    } finally {
      setCreating(false);
    }
  }, [catalog, titleInput, release]);

  // ── Step 2 — Upload automatique audio + pochette ──

  const handleContinueStep2 = useCallback(async () => {
    if (!audioRef.current || !coverRef.current) return;
    setUploading2(true);
    setError(null);
    try {
      await audioRef.current.triggerUpload();
      await coverRef.current.triggerUpload();
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setUploading2(false);
    }
  }, []);

  // ── Step 3 — Enregistrer les métadonnées ──

  const handleSaveMeta = useCallback(async () => {
    if (!release) return;
    if (!meta.genreId) {
      setError("Sélectionnez un genre avant de continuer.");
      return;
    }
    setSavingMeta(true);
    setError(null);
    try {
      const genreIds = [meta.genreId];
      await catalog.updateTrack(release.trackId, {
        language: meta.language.length === 2 ? meta.language : undefined,
        explicit: meta.explicit,
        genreIds,
      });
      await catalog.setTrackCredits({
        trackId: release.trackId,
        credits: [
          meta.auteur.trim() ? { contributorName: meta.auteur.trim(), role: "auteur" as const, displayOrder: 0 } : null,
          meta.compositeur.trim() ? { contributorName: meta.compositeur.trim(), role: "compositeur" as const, displayOrder: 1 } : null,
          meta.producteur.trim() ? { contributorName: meta.producteur.trim(), role: "producteur" as const, displayOrder: 2 } : null,
        ].filter(Boolean) as { contributorName: string; role: "auteur" | "compositeur" | "producteur"; displayOrder: number }[],
      });
      if (meta.releaseDate) {
        await catalog.updateAlbum(release.albumId, { releaseDate: meta.releaseDate });
      }
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder. Réessayez.");
    } finally {
      setSavingMeta(false);
    }
  }, [catalog, release, meta]);

  // ── Step 4 — Publier ──

  const handlePublish = useCallback(async () => {
    if (!release) return;
    setPublishing(true);
    setError(null);
    try {
      await catalog.submitAlbum(release.albumId);
      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de publier. Réessayez.");
    } finally {
      setPublishing(false);
    }
  }, [catalog, release]);

  // ── Published success screen ──

  if (published) {
    return (
      <div className="pub-wiz pub-wiz--success">
        <div className="pub-wiz__success-inner">
          <div className="pub-wiz__success-icon" aria-hidden="true">🎉</div>
          <h2 className="pub-wiz__success-title">{release?.title} est en route !</h2>
          <p className="pub-wiz__success-sub">
            Ton morceau est en cours de vérification. Tu seras notifié dès qu&apos;il sera en ligne.
          </p>
          <button className="pub-wiz__publish-btn" onClick={onComplete}>
            Retour à mes morceaux
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pub-wiz">
      <WizardProgress step={step} />

      {error && (
        <p className="pub-wiz__error" role="alert">{error}</p>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="pub-wiz__body pub-wiz__body--centered">
          <div className="pub-wiz__card pub-wiz__card--wide">
            <h2 className="pub-wiz__card-title">Titre du morceau</h2>
            <p className="pub-wiz__card-sub">Choisissez un titre clair et mémorable pour votre morceau.</p>
            <form onSubmit={handleCreateRelease} className="pub-wiz__form">
              <div className="pub-wiz__field">
                <input
                  className="pub-wiz__input"
                  type="text"
                  placeholder="Ex : Mon Beau Pays"
                  value={titleInput}
                  maxLength={FIELD_LIMITS.TRACK_TITLE}
                  onChange={(e) => setTitleInput(e.target.value)}
                  autoFocus
                  aria-label="Titre du morceau"
                />
                <span className="pub-wiz__counter">
                  {titleInput.length}/{FIELD_LIMITS.TRACK_TITLE}
                </span>
              </div>
              <div className="pub-wiz__actions">
                <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={onCancel}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="pub-wiz__btn pub-wiz__btn--primary"
                  disabled={creating || titleInput.trim().length < 2}
                >
                  {creating ? "Création…" : "Continuer →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && release && (
        <>
          <div className="pub-wiz__body pub-wiz__body--step2">
            {/* Audio card */}
            <div className="pub-wiz__card">
              <h3 className="pub-wiz__card-title">🎵 Fichier audio</h3>
              <p className="pub-wiz__card-sub">MP3 · M4A · WAV — max 100 Mo</p>
              <AudioUploader
                ref={audioRef}
                trackId={release.trackId}
                creatorId={creatorId}
                onFileReady={() => setAudioReady(true)}
                onFileCleared={() => setAudioReady(false)}
              />
            </div>

            {/* Cover card */}
            <div className="pub-wiz__card">
              <h3 className="pub-wiz__card-title">🖼 Pochette</h3>
              <p className="pub-wiz__card-sub">JPG · PNG · WebP — max {IMAGE_POLICY.maxLabel}</p>
              <CoverUploader
                ref={coverRef}
                albumId={release.albumId}
                creatorId={creatorId}
                onFileReady={() => setCoverReady(true)}
                onFileCleared={() => setCoverReady(false)}
              />
            </div>

            {/* Tips card */}
            <div className="pub-wiz__card pub-wiz__card--tips-step2">
              <p className="pub-wiz__tips-title">💡 Conseils SONAFRIK</p>
              <ul className="pub-wiz__tips-list">
                {[
                  "MP3 320 kbps recommandé",
                  "JPG · PNG · WebP",
                  "Minimum 1400×1400 px (recommandé 3000×3000)",
                  "Bonne qualité = meilleure visibilité",
                ].map((tip) => (
                  <li key={tip} className="pub-wiz__tips-item pub-wiz__tips-item--check">
                    <span className="pub-wiz__tips-icon" aria-hidden="true">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pub-wiz__actions">
            <button className="pub-wiz__btn pub-wiz__btn--ghost" onClick={() => setStep(1)}>
              ← Retour
            </button>
            <button
              className="pub-wiz__btn pub-wiz__btn--primary"
              disabled={uploading2 || !audioReady || !coverReady}
              onClick={() => void handleContinueStep2()}
            >
              {uploading2 ? "Envoi en cours…" : "Continuer →"}
            </button>
          </div>
        </>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && release && (
        <div className="pub-wiz__body pub-wiz__body--two-col">
          <div className="pub-wiz__main">
            <div className="pub-wiz__card">
              <h2 className="pub-wiz__card-title">Informations du morceau</h2>

              <div className="pub-wiz__form-grid">
                <label className="pub-wiz__label">
                  Genre <span className="pub-wiz__required" aria-hidden="true">*</span>
                  <select
                    className="pub-wiz__select"
                    value={meta.genreId}
                    required
                    aria-required="true"
                    onChange={(e) => setMeta((m) => ({ ...m, genreId: e.target.value }))}
                  >
                    <option value="">Sélectionner un genre</option>
                    {genres.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </label>

                <label className="pub-wiz__label">
                  Langue
                  <select
                    className="pub-wiz__select"
                    value={meta.language}
                    onChange={(e) => setMeta((m) => ({ ...m, language: e.target.value }))}
                  >
                    {LANG_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </label>

                <label className="pub-wiz__label">
                  Auteur
                  <input
                    className="pub-wiz__input"
                    type="text"
                    maxLength={100}
                    value={meta.auteur}
                    onChange={(e) => setMeta((m) => ({ ...m, auteur: e.target.value }))}
                    placeholder="Nom de l'auteur"
                  />
                </label>

                <label className="pub-wiz__label">
                  Compositeur
                  <input
                    className="pub-wiz__input"
                    type="text"
                    maxLength={100}
                    value={meta.compositeur}
                    onChange={(e) => setMeta((m) => ({ ...m, compositeur: e.target.value }))}
                    placeholder="Nom du compositeur"
                  />
                </label>

                <label className="pub-wiz__label">
                  Producteur
                  <input
                    className="pub-wiz__input"
                    type="text"
                    maxLength={100}
                    value={meta.producteur}
                    onChange={(e) => setMeta((m) => ({ ...m, producteur: e.target.value }))}
                    placeholder="Nom du producteur"
                  />
                </label>

                <label className="pub-wiz__label">
                  Date de sortie
                  <input
                    className="pub-wiz__input"
                    type="date"
                    value={meta.releaseDate}
                    onChange={(e) => setMeta((m) => ({ ...m, releaseDate: e.target.value }))}
                  />
                </label>
              </div>

              <label className="pub-wiz__toggle-row">
                <input
                  type="checkbox"
                  className="pub-wiz__toggle"
                  checked={meta.explicit}
                  onChange={(e) => setMeta((m) => ({ ...m, explicit: e.target.checked }))}
                />
                <span className="pub-wiz__toggle-label">Contenu explicite (paroles)</span>
              </label>
            </div>

            <div className="pub-wiz__actions">
              <button className="pub-wiz__btn pub-wiz__btn--ghost" onClick={() => setStep(2)}>
                ← Retour
              </button>
              <button
                className="pub-wiz__btn pub-wiz__btn--primary"
                disabled={savingMeta || !meta.genreId}
                onClick={() => void handleSaveMeta()}
              >
                {savingMeta ? "Sauvegarde…" : "Continuer →"}
              </button>
            </div>
          </div>

          <div className="pub-wiz__aside">
            <PublicationChecklist ctx={checklistCtx} />
            <div className="pub-wiz__aside-summary">
              <p className="pub-wiz__aside-title">Résumé</p>
              <p className="pub-wiz__aside-row"><span>Titre</span><span>{release.title}</span></p>
              <p className="pub-wiz__aside-row"><span>Audio</span><span style={{ color: "var(--color-vert-energie)" }}>✔</span></p>
              <p className="pub-wiz__aside-row"><span>Pochette</span><span style={{ color: "var(--color-vert-energie)" }}>✔</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {step === 4 && release && (
        <div className="pub-wiz__body pub-wiz__body--two-col">
          <div className="pub-wiz__main">
            <div className="pub-wiz__card">
              <h2 className="pub-wiz__card-title">Résumé de publication</h2>

              <div className="pub-wiz__review-list">
                {[
                  { label: "Titre", value: release.title, editStep: 1 },
                  { label: "Audio", value: "Validé", editStep: 2 },
                  { label: "Pochette", value: "Validée", editStep: 2 },
                  { label: "Genre", value: genres.find((g) => g.id === meta.genreId)?.name || "—", editStep: 3 },
                  { label: "Langue", value: LANG_OPTIONS.find((l) => l.code === meta.language)?.label || "—", editStep: 3 },
                  { label: "Auteur", value: meta.auteur || "—", editStep: 3 },
                  { label: "Compositeur", value: meta.compositeur || "—", editStep: 3 },
                  { label: "Producteur", value: meta.producteur || "—", editStep: 3 },
                  { label: "Date de sortie", value: meta.releaseDate || "—", editStep: 3 },
                  { label: "Contenu explicite", value: meta.explicit ? "Oui" : "Non", editStep: 3 },
                  { label: "ISRC", value: "Généré automatiquement", editStep: null },
                ].map(({ label, value, editStep }) => (
                  <div key={label} className="pub-wiz__review-row">
                    <span className="pub-wiz__review-check" aria-hidden="true">✔</span>
                    <span className="pub-wiz__review-label">{label}</span>
                    <span className="pub-wiz__review-value">{value}</span>
                    {editStep && (
                      <button
                        className="pub-wiz__review-edit"
                        onClick={() => setStep(editStep as WizardStep)}
                        aria-label={`Modifier ${label}`}
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="pub-wiz__publish-btn"
              disabled={publishing}
              onClick={() => void handlePublish()}
            >
              {publishing ? "Publication en cours…" : "🚀 Publier maintenant"}
            </button>

            {error && (
              <p className="pub-wiz__error" role="alert">{error}</p>
            )}

            <button className="pub-wiz__btn pub-wiz__btn--ghost pub-wiz__btn--sm" onClick={() => setStep(3)}>
              ← Retour
            </button>
          </div>

          <div className="pub-wiz__aside">
            <div className="pub-wiz__aside-summary">
              <p className="pub-wiz__aside-title">Aperçu du morceau</p>
              <div className="pub-wiz__preview-track">
                {coverPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreviewUrl}
                    alt=""
                    className="pub-wiz__preview-cover pub-wiz__preview-cover--img"
                  />
                ) : (
                  <div className="pub-wiz__preview-cover" aria-hidden="true">🎵</div>
                )}
                <div>
                  <p className="pub-wiz__preview-title">{release.title}</p>
                  <p className="pub-wiz__preview-artist">{stageName}</p>
                </div>
              </div>
            </div>
            <TipsPanel tips={[
              { icon: "🌍", text: "Ton morceau sera disponible dans toute l'Afrique de l'Ouest dès validation." },
              { icon: "💰", text: "Tu touches 90 % des revenus de streaming générés." },
              { icon: "📊", text: "Suis tes stats en temps réel dans l'onglet Analytics." },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}
