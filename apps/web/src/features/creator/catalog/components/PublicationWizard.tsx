"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioUploader } from "./AudioUploader";
import { CoverUploader } from "./CoverUploader";
import type { AudioUploaderHandle } from "./AudioUploader";
import type { CoverUploaderHandle } from "./CoverUploader";
import { ensureAlbumHasCover } from "../lib/ensureAlbumCover";
import {
  type WizardStep,
  WIZARD_STEP_LABELS,
  canNavigateToStep,
  computeMaxValidatedStep,
  isStepClickable,
  pushWizardHistoryStep,
  readWizardStepFromHistoryState,
  replaceWizardHistoryStep,
  resolveStepStatus,
} from "@sonafrik/shared/publication-wizard";
import { useCatalogService } from "../hooks/useCatalog";
import type { Genre } from "@sonafrik/types";
import { FIELD_LIMITS } from "@sonafrik/shared/field-limits";
import { DEV_MOCK_CREATOR_ID } from "@sonafrik/shared/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreatedRelease {
  albumId: string;
  trackId: string;
  title: string;
  creatorId: string;
}

interface MetadataForm {
  genreId: string;
  language: string;
  lyrics: string;
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
] as const;

function resolveLanguageLabel(code: string): string {
  return LANG_OPTIONS.find((l) => l.code === code)?.label ?? code;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function WizardProgress({
  step,
  maxValidatedStep,
  onStepSelect,
}: {
  step: WizardStep;
  maxValidatedStep: WizardStep;
  onStepSelect: (target: WizardStep) => void;
}) {
  return (
    <nav className="pub-wiz__progress" aria-label="Étapes de publication">
      {WIZARD_STEP_LABELS.map((label, i) => {
        const n = (i + 1) as WizardStep;
        const status = resolveStepStatus(n, step, maxValidatedStep);
        const clickable = isStepClickable(n, step, maxValidatedStep);
        return (
          <div key={n} className={`pub-wiz__step pub-wiz__step--${status}`}>
            <button
              type="button"
              className="pub-wiz__step-btn"
              disabled={!clickable}
              aria-current={status === "active" ? "step" : undefined}
              aria-label={
                status === "active"
                  ? `Étape ${n} — ${label} (actuelle)`
                  : clickable
                    ? `Revenir à l'étape ${n} — ${label}`
                    : `Étape ${n} — ${label} (verrouillée)`
              }
              onClick={() => onStepSelect(n)}
            >
              <span className="pub-wiz__step-dot" aria-hidden="true">
                {status === "done" && n !== step ? "✓" : n}
              </span>
              <span className="pub-wiz__step-label">{label}</span>
            </button>
            {i < WIZARD_STEP_LABELS.length - 1 && (
              <div
                className={`pub-wiz__step-line${status === "done" ? " pub-wiz__step-line--done" : ""}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
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
  const [uploading2, setUploading2] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresError, setGenresError] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverFetchedAlbumRef = useRef<string | null>(null);
  const [meta, setMeta] = useState<MetadataForm>({
    genreId: "",
    language: "fr",
    lyrics: "",
    explicit: false,
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [filesCompleted, setFilesCompleted] = useState(false);
  const [metadataCompleted, setMetadataCompleted] = useState(false);
  const [step2Mounted, setStep2Mounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCreatorId, setSessionCreatorId] = useState<string | null>(null);
  const savedMetaSnapshotRef = useRef("");

  const stepRef = useRef(step);
  const maxValidatedRef = useRef<WizardStep>(1);
  stepRef.current = step;

  const maxValidatedStep = computeMaxValidatedStep({
    hasRelease: Boolean(release),
    filesCompleted,
    metadataCompleted,
  });
  maxValidatedRef.current = maxValidatedStep;

  const invalidateCoverPreview = useCallback(() => {
    coverFetchedAlbumRef.current = null;
    setCoverPreviewUrl(null);
  }, []);

  useEffect(() => {
    if (!metadataCompleted) {
      savedMetaSnapshotRef.current = JSON.stringify(meta);
      return;
    }
    const snapshot = JSON.stringify(meta);
    if (savedMetaSnapshotRef.current && snapshot !== savedMetaSnapshotRef.current) {
      setMetadataCompleted(false);
    }
  }, [meta, metadataCompleted]);

  const goToStep = useCallback(
    (target: WizardStep, options?: { replace?: boolean }) => {
      if (!canNavigateToStep(target, maxValidatedRef.current)) return;
      if (target === stepRef.current) return;
      setStep(target);
      setError(null);
      if (options?.replace) {
        replaceWizardHistoryStep(target);
      } else {
        pushWizardHistoryStep(target);
      }
    },
    [],
  );

  const goBack = useCallback(() => {
    if (stepRef.current === 1) {
      onCancel();
      return;
    }
    goToStep((stepRef.current - 1) as WizardStep);
  }, [goToStep, onCancel]);

  useEffect(() => {
    if (published) return;
    replaceWizardHistoryStep(1);
  }, [published]);

  useEffect(() => {
    if (published) return;
    const onPopState = (event: PopStateEvent) => {
      const target = readWizardStepFromHistoryState(event.state);
      if (target === null) return;
      if (canNavigateToStep(target, maxValidatedRef.current)) {
        setStep(target);
        setError(null);
        return;
      }
      pushWizardHistoryStep(stepRef.current);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [published]);

  useEffect(() => {
    if (step === 2 && release) setStep2Mounted(true);
  }, [step, release]);

  useEffect(() => {
    void catalog
      .getCatalogContext()
      .then((ctx) => setSessionCreatorId(ctx.creatorId))
      .catch(() => {});
  }, [catalog]);

  useEffect(() => {
    if (!release?.albumId) return;
    void catalog
      .getAlbum(release.albumId)
      .then((album) => {
        if (album.creator_id && album.creator_id !== release.creatorId) {
          setRelease((current) =>
            current ? { ...current, creatorId: album.creator_id } : current,
          );
        }
      })
      .catch(() => {});
  }, [catalog, release?.albumId, release?.creatorId]);

  const uploadCreatorId =
    release?.creatorId ??
    sessionCreatorId ??
    (creatorId !== DEV_MOCK_CREATOR_ID ? creatorId : null);

  const genreLabel = genres.find((g) => g.id === meta.genreId)?.name ?? "—";
  const languageLabel = resolveLanguageLabel(meta.language);

  const loadGenres = useCallback(() => {
    setGenresError(false);
    void catalog
      .getGenres()
      .then((list) => setGenres(list.filter((g) => g.is_active)))
      .catch(() => setGenresError(true));
  }, [catalog]);

  // Load genres when step 3 or 4 is active or already validated
  useEffect(() => {
    if (step !== 3 && step !== 4 && maxValidatedStep < 3) return;
    if (genres.length > 0) return;
    loadGenres();
  }, [step, maxValidatedStep, genres.length, loadGenres]);

  // Load cover preview for step 4 — once per album (memo via ref)
  useEffect(() => {
    if (step !== 4 || !release) return;
    if (coverFetchedAlbumRef.current === release.albumId) return;
    coverFetchedAlbumRef.current = release.albumId;
    let cancelled = false;
    void (async () => {
      try {
        const album = await catalog.getAlbum(release.albumId);
        if (!album.cover_path) return;
        const { signedUrl } = await catalog.requestCoverReadUrl({
          creatorId: uploadCreatorId ?? release.creatorId,
          path: album.cover_path,
        });
        if (!cancelled) setCoverPreviewUrl(signedUrl);
      } catch {
        if (!cancelled) setCoverPreviewUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [step, release, catalog, uploadCreatorId]);

  // ── Step 1 — Créer le morceau ──

  const handleCreateRelease = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim().length < 2) return;
    if (release) {
      goToStep(2);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const album = await catalog.createAlbum({ title: titleInput.trim(), releaseType: "single" });
      const tracks = await catalog.listTracks(album.id);
      const autoTrack = tracks[0];
      if (!autoTrack) throw new Error("Morceau introuvable après création.");
      setRelease({
        albumId: album.id,
        trackId: autoTrack.id,
        title: titleInput.trim(),
        creatorId: album.creator_id,
      });
      goToStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le morceau. Réessayez.");
    } finally {
      setCreating(false);
    }
  }, [catalog, titleInput, release, goToStep]);

  // ── Step 2 — Upload automatique audio + pochette ──

  const handleContinueStep2 = useCallback(async () => {
    if (!release) return;
    if (filesCompleted) {
      goToStep(3);
      return;
    }
    if (!audioRef.current || !coverRef.current) return;
    setUploading2(true);
    setError(null);
    try {
      const album = await catalog.getAlbum(release.albumId);
      const effectiveCreatorId = album.creator_id;
      if (effectiveCreatorId !== release.creatorId) {
        setRelease((current) =>
          current ? { ...current, creatorId: effectiveCreatorId } : current,
        );
      }
      await audioRef.current.triggerUpload(effectiveCreatorId);
      await coverRef.current.ensureCover({
        trackTitle: release.title,
        artistName: stageName,
        creatorId: effectiveCreatorId,
      });
      setFilesCompleted(true);
      goToStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setUploading2(false);
    }
  }, [release, stageName, catalog, goToStep, filesCompleted]);

  // ── Step 3 — Enregistrer les métadonnées ──

  const handleSaveMeta = useCallback(async () => {
    if (!release) return;
    if (metadataCompleted) {
      goToStep(4);
      return;
    }
    if (!meta.genreId) {
      setError("Sélectionnez un genre avant de continuer.");
      return;
    }
    setSavingMeta(true);
    setError(null);
    try {
      await catalog.saveWizardUserMetadata({
        trackId: release.trackId,
        genreId: meta.genreId,
        language: meta.language,
        lyrics: meta.lyrics.trim() || undefined,
        explicit: meta.explicit || undefined,
      });
      savedMetaSnapshotRef.current = JSON.stringify(meta);
      setMetadataCompleted(true);
      goToStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder. Réessayez.");
    } finally {
      setSavingMeta(false);
    }
  }, [catalog, release, meta, goToStep, metadataCompleted]);

  // ── Step 4 — Publier ──

  const handlePublish = useCallback(async () => {
    if (!release) return;
    setPublishing(true);
    setError(null);
    try {
      const album = await catalog.getAlbum(release.albumId);
      await ensureAlbumHasCover(catalog, {
        albumId: release.albumId,
        creatorId: album.creator_id,
        trackTitle: release.title,
        artistName: stageName,
      });
      await catalog.submitAlbum(release.albumId);
      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de publier. Réessayez.");
    } finally {
      setPublishing(false);
    }
  }, [catalog, release, stageName]);

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
      <WizardProgress step={step} maxValidatedStep={maxValidatedStep} onStepSelect={goToStep} />

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
                <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={goBack}>
                  ← Retour
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

      {/* ── STEP 2 — monté une fois visité pour conserver l'état des uploaders ── */}
      {step2Mounted && release && (
        <div className="pub-wiz__step-panel" hidden={step !== 2}>
          <div className="pub-wiz__body pub-wiz__body--step2">
            <div className="pub-wiz__card pub-wiz__card--compact">
              <h3 className="pub-wiz__card-title">Fichier audio</h3>
              <p className="pub-wiz__card-sub">Choisissez le morceau à publier.</p>
              <AudioUploader
                ref={audioRef}
                trackId={release.trackId}
                creatorId={uploadCreatorId ?? release.creatorId}
                onFileReady={() => setAudioReady(true)}
                onFileCleared={() => {
                  setAudioReady(false);
                  if (filesCompleted) setFilesCompleted(false);
                }}
              />
            </div>

            <div className="pub-wiz__card pub-wiz__card--compact">
              <h3 className="pub-wiz__card-title">Pochette</h3>
              <p className="pub-wiz__card-sub">
                Optionnel — SONAFRIK optimise automatiquement votre image.
              </p>
              <CoverUploader
                ref={coverRef}
                coverEngine="smart"
                albumId={release.albumId}
                creatorId={uploadCreatorId ?? release.creatorId}
                onFileCleared={() => {
                  if (filesCompleted) setFilesCompleted(false);
                  invalidateCoverPreview();
                }}
                onSuccess={() => invalidateCoverPreview()}
              />
            </div>
          </div>

          <div className="pub-wiz__actions">
            <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={goBack}>
              ← Retour
            </button>
            <button
              type="button"
              className="pub-wiz__btn pub-wiz__btn--primary"
              disabled={uploading2 || !audioReady}
              onClick={() => void handleContinueStep2()}
            >
              {uploading2 ? "Envoi en cours…" : "Continuer →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Informations ── */}
      {step === 3 && release && (
        <div className="pub-wiz__body pub-wiz__body--step3">
          <div className="pub-wiz__card pub-wiz__card--compact">
            <h2 className="pub-wiz__card-title">Informations du morceau</h2>
            <p className="pub-wiz__card-sub">
              Seuls le genre et la langue sont requis. Le reste est généré automatiquement par SONAFRIK.
            </p>

            <div className="pub-wiz__form-grid pub-wiz__form-grid--step3">
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
                {genresError && (
                  <p className="pub-wiz__field-error" role="alert">
                    Impossible de charger les genres.{" "}
                    <button type="button" className="pub-wiz__link-btn" onClick={loadGenres}>
                      Réessayer
                    </button>
                  </p>
                )}
              </label>

              <label className="pub-wiz__label">
                Langue <span className="pub-wiz__required" aria-hidden="true">*</span>
                <select
                  className="pub-wiz__select"
                  value={meta.language}
                  required
                  aria-required="true"
                  onChange={(e) => setMeta((m) => ({ ...m, language: e.target.value }))}
                >
                  {LANG_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <details className="pub-wiz__advanced">
              <summary className="pub-wiz__advanced-summary">
                Options avancées
                <span className="pub-wiz__advanced-hint">Paroles · Contenu explicite</span>
              </summary>
              <div className="pub-wiz__advanced-body">
                <label className="pub-wiz__label">
                  Ajouter les paroles
                  <span className="pub-wiz__optional">Facultatif</span>
                  <textarea
                    className="pub-wiz__textarea"
                    value={meta.lyrics}
                    rows={4}
                    placeholder="Collez ou saisissez les paroles de votre morceau…"
                    onChange={(e) => setMeta((m) => ({ ...m, lyrics: e.target.value }))}
                  />
                </label>

                <div className="pub-wiz__explicit-row">
                  <label className="pub-wiz__toggle-row pub-wiz__toggle-row--block">
                    <input
                      type="checkbox"
                      className="pub-wiz__toggle"
                      checked={meta.explicit}
                      onChange={(e) => setMeta((m) => ({ ...m, explicit: e.target.checked }))}
                    />
                    <span className="pub-wiz__toggle-label">
                      Contenu explicite
                      <span className="pub-wiz__optional">Facultatif</span>
                    </span>
                  </label>
                  <p className="pub-wiz__explicit-help">
                    Cochez cette case uniquement si votre musique contient des insultes, des propos sexuels,
                    des contenus violents ou d&apos;autres contenus nécessitant un avertissement.
                  </p>
                </div>
              </div>
            </details>
          </div>

          <div className="pub-wiz__actions pub-wiz__actions--step3">
            <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={goBack}>
              ← Retour
            </button>
            <button
              type="button"
              className="pub-wiz__btn pub-wiz__btn--primary"
              disabled={savingMeta || !meta.genreId || !meta.language}
              onClick={() => void handleSaveMeta()}
            >
              {savingMeta ? "Sauvegarde…" : "Continuer →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 — Confirmation avant publication ── */}
      {step === 4 && release && (
        <div className="pub-wiz__body pub-wiz__body--confirm">
          <article className="pub-wiz__confirm-card" aria-labelledby="pub-wiz-confirm-title">
            <header className="pub-wiz__confirm-hero">
              <p className="pub-wiz__confirm-ready">
                <span className="pub-wiz__confirm-ready-icon" aria-hidden="true">✓</span>
                Votre musique est prête à être publiée.
              </p>
              <p className="pub-wiz__confirm-reassurance">
                Tout est prêt. Après publication, votre morceau sera envoyé en validation avant sa mise en ligne.
              </p>
            </header>

            <div className="pub-wiz__confirm-summary">
              <div className="pub-wiz__confirm-cover-wrap">
                {coverPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreviewUrl}
                    alt={`Pochette de ${release.title}`}
                    className="pub-wiz__confirm-cover-side pub-wiz__confirm-cover-side--img"
                  />
                ) : (
                  <div className="pub-wiz__confirm-cover-side pub-wiz__confirm-cover-side--placeholder" aria-hidden="true">
                    🎵
                  </div>
                )}
              </div>

              <div className="pub-wiz__confirm-meta">
                <h2 id="pub-wiz-confirm-title" className="pub-wiz__confirm-track-title">
                  {release.title}
                </h2>
                <p className="pub-wiz__confirm-artist-name">{stageName}</p>
                <dl className="pub-wiz__confirm-meta-list">
                  <div className="pub-wiz__confirm-meta-row">
                    <dt className="pub-wiz__confirm-meta-label">Genre</dt>
                    <dd>{genreLabel ?? "—"}</dd>
                  </div>
                  <div className="pub-wiz__confirm-meta-row">
                    <dt className="pub-wiz__confirm-meta-label">Langue</dt>
                    <dd>{languageLabel}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <ul className="pub-wiz__confirm-status" aria-label="État des fichiers">
              <li className="pub-wiz__confirm-status-item">
                <span className="pub-wiz__confirm-status-icon" aria-hidden="true">✓</span>
                Audio prêt
              </li>
              <li className="pub-wiz__confirm-status-item">
                <span className="pub-wiz__confirm-status-icon" aria-hidden="true">{coverPreviewUrl ? "✓" : "🎨"}</span>
                {coverPreviewUrl ? "Pochette prête" : "Pochette automatique SONAFRIK"}
              </li>
            </ul>

            <p className="pub-wiz__confirm-tip">
              Vous pourrez modifier les informations de votre morceau tant qu&apos;il n&apos;aura pas été validé.
            </p>

            <div className="pub-wiz__confirm-actions">
              <button
                type="button"
                className="pub-wiz__btn pub-wiz__btn--ghost"
                disabled={publishing}
                onClick={() => goToStep(3)}
              >
                ← Retour aux informations
              </button>
              <button
                type="button"
                className="pub-wiz__btn pub-wiz__btn--primary pub-wiz__btn--publish"
                disabled={publishing}
                onClick={() => void handlePublish()}
              >
                {publishing ? "Publication en cours…" : "Publier maintenant"}
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
