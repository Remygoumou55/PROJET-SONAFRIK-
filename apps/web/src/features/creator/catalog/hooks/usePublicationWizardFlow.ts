"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAlbumHasCover } from "../lib/ensureAlbumCover";
import { resolveWizardLanguageLabel } from "../lib/publicationWizardConstants";
import type { CreatedRelease, WizardMetadataForm } from "../lib/publicationWizardTypes";
import type { ReviewAudioInfo } from "../components/WizardStep4Panel";
import type { AudioUploaderHandle } from "../components/AudioUploader";
import type { CoverUploaderHandle } from "../components/CoverUploader";
import {
  type WizardProgressFlags,
  type WizardStep,
  canNavigateToStep,
  clearWizardSession,
  computeMaxValidatedStep,
  parseWizardStepFromSearch,
  pushWizardHistoryStep,
  readWizardSession,
  readWizardStepFromHistoryState,
  replaceWizardHistoryStep,
  resolveInitialWizardStep,
  writeWizardSession,
} from "@sonafrik/shared/publication-wizard";
import { useCatalogService } from "./useCatalog";
import { usePublicationWizardSrtsp } from "./usePublicationWizardSrtsp";
import type { Genre } from "@sonafrik/types";
import { DEV_MOCK_CREATOR_ID } from "@sonafrik/shared/auth";
import { wizardErrorMessage } from "../lib/wizardErrorMessage";

interface UsePublicationWizardFlowOptions {
  creatorId: string;
  stageName: string;
  onCancel: () => void;
}

export function usePublicationWizardFlow({
  creatorId,
  stageName,
  onCancel,
}: UsePublicationWizardFlowOptions) {
  const catalog = useCatalogService();
  const srtsp = usePublicationWizardSrtsp();

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
  const [meta, setMeta] = useState<WizardMetadataForm>({
    genreId: "",
    language: "fr",
    lyrics: "",
    explicit: false,
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);
  const [savingReview, setSavingReview] = useState(false);
  const [replacingMedia, setReplacingMedia] = useState(false);
  const [audioFileInfo, setAudioFileInfo] = useState<ReviewAudioInfo | null>(null);
  const [audioInfoLoading, setAudioInfoLoading] = useState(false);
  const [filesCompleted, setFilesCompleted] = useState(false);
  const [metadataCompleted, setMetadataCompleted] = useState(false);
  const [step2Mounted, setStep2Mounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCreatorId, setSessionCreatorId] = useState<string | null>(null);
  const savedMetaSnapshotRef = useRef("");
  const metaRef = useRef(meta);
  metaRef.current = meta;
  const [initialized, setInitialized] = useState(false);

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

  const loadGenres = useCallback(() => {
    setGenresError(false);
    void catalog
      .getGenres()
      .then((list) => setGenres(list.filter((g) => g.is_active)))
      .catch(() => setGenresError(true));
  }, [catalog]);

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

  useEffect(() => {
    if (initialized) return;

    const session = readWizardSession();
    let flags = {
      hasRelease: false,
      filesCompleted: false,
      metadataCompleted: false,
    };

    if (session) {
      setRelease(session.release);
      setTitleInput(session.titleInput);
      setFilesCompleted(session.filesCompleted);
      setMetadataCompleted(session.metadataCompleted);
      setMeta(session.meta);
      savedMetaSnapshotRef.current = JSON.stringify(session.meta);
      if (session.step2Visited) setStep2Mounted(true);
      flags = {
        hasRelease: true,
        filesCompleted: session.filesCompleted,
        metadataCompleted: session.metadataCompleted,
      };
    }

    const max = computeMaxValidatedStep({
      hasRelease: flags.hasRelease,
      filesCompleted: flags.filesCompleted,
      metadataCompleted: flags.metadataCompleted,
    });
    const urlStep = parseWizardStepFromSearch(window.location.search);
    const historyStep = readWizardStepFromHistoryState(window.history.state);
    const initial = resolveInitialWizardStep(urlStep, historyStep, max);

    setStep(initial);
    replaceWizardHistoryStep(initial);
    setInitialized(true);
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;
    if (!release) return;
    writeWizardSession({
      release,
      titleInput,
      filesCompleted,
      metadataCompleted,
      meta,
      step2Visited: step2Mounted,
    });
  }, [
    initialized,
    release,
    titleInput,
    filesCompleted,
    metadataCompleted,
    meta,
    step2Mounted,
  ]);

  const goToStep = useCallback(
    (
      target: WizardStep,
      options?: { replace?: boolean; progressFlags?: WizardProgressFlags },
    ) => {
      const maxValidated = options?.progressFlags
        ? computeMaxValidatedStep(options.progressFlags)
        : maxValidatedRef.current;
      if (!canNavigateToStep(target, maxValidated)) return;
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
      if (release) {
        srtsp.cancelled({
          albumId: release.albumId,
          trackId: release.trackId,
          creatorId: release.creatorId,
          title: release.title,
        });
      }
      onCancel();
      return;
    }
    goToStep((stepRef.current - 1) as WizardStep);
  }, [goToStep, onCancel, release, srtsp]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if ((step === 2 || step === 4) && release) setStep2Mounted(true);
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

  useEffect(() => {
    if (step !== 3 || !release || meta.lyrics.trim()) return;
    let cancelled = false;
    void catalog
      .getWizardTrackLyrics(release.trackId, meta.language)
      .then((lyrics) => {
        if (cancelled || !lyrics.trim()) return;
        setMeta((current) => (current.lyrics.trim() ? current : { ...current, lyrics }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [step, release, meta.language, meta.lyrics, catalog]);

  const uploadCreatorId =
    release?.creatorId ??
    sessionCreatorId ??
    (creatorId !== DEV_MOCK_CREATOR_ID ? creatorId : null);

  const genreLabel = genres.find((g) => g.id === meta.genreId)?.name ?? "—";
  const languageLabel = resolveWizardLanguageLabel(meta.language);

  useEffect(() => {
    if (!release && step !== 3 && step !== 4 && maxValidatedStep < 3) return;
    if (genres.length > 0) return;
    loadGenres();
  }, [release, step, maxValidatedStep, genres.length, loadGenres]);

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

  useEffect(() => {
    if (step !== 4 || !release) return;
    let cancelled = false;
    setAudioInfoLoading(true);
    void (async () => {
      try {
        const [files, track] = await Promise.all([
          catalog.getTrackFiles(release.trackId),
          catalog.getTrack(release.trackId),
        ]);
        if (cancelled) return;
        const primary = files.find((f) => f.is_primary) ?? files[0];
        if (!primary) {
          setAudioFileInfo(null);
          return;
        }
        const sizeMb = (primary.file_size_bytes ?? 0) / 1024 / 1024;
        setAudioFileInfo({
          fileName: primary.file_path.split("/").pop() ?? "audio",
          durationSeconds: track.duration_seconds ?? primary.duration_seconds ?? 0,
          format: primary.format,
          sizeLabel: `${sizeMb.toFixed(1)} Mo`,
        });
      } catch {
        if (!cancelled) setAudioFileInfo(null);
      } finally {
        if (!cancelled) setAudioInfoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, release, catalog]);

  const handleReviewTitleSave = useCallback(
    async (title: string) => {
      if (!release || title.length < 2 || title === release.title) return;
      setSavingReview(true);
      setError(null);
      try {
        await Promise.all([
          catalog.updateTrack(release.trackId, { title }),
          catalog.updateAlbum(release.albumId, { title }),
        ]);
        setRelease({ ...release, title });
        setTitleInput(title);
        srtsp.draftUpdated({
          albumId: release.albumId,
          trackId: release.trackId,
          creatorId: release.creatorId,
          title,
        });
      } catch (err) {
        setError(wizardErrorMessage(err, "Impossible de mettre à jour le titre."));
      } finally {
        setSavingReview(false);
      }
    },
    [catalog, release, srtsp],
  );

  const handleReviewMetaSave = useCallback(async (patch?: Partial<WizardMetadataForm>) => {
    if (!release) return;
    const effectiveMeta = patch ? { ...metaRef.current, ...patch } : metaRef.current;
    if (!effectiveMeta.genreId) return;
    setSavingReview(true);
    setError(null);
    try {
      await catalog.saveWizardUserMetadata({
        trackId: release.trackId,
        genreId: effectiveMeta.genreId,
        language: effectiveMeta.language,
        lyrics: effectiveMeta.lyrics.trim() || undefined,
        explicit: effectiveMeta.explicit || undefined,
      });
      savedMetaSnapshotRef.current = JSON.stringify(effectiveMeta);
      srtsp.draftUpdated({
        albumId: release.albumId,
        trackId: release.trackId,
        creatorId: release.creatorId,
        title: release.title,
      });
    } catch (err) {
      setError(wizardErrorMessage(err, "Impossible de sauvegarder les métadonnées."));
    } finally {
      setSavingReview(false);
    }
  }, [catalog, release, srtsp]);

  const handleReplaceCover = useCallback(() => {
    setReplacingMedia(true);
    coverRef.current?.openFilePicker();
  }, []);

  const handleReplaceAudio = useCallback(() => {
    setReplacingMedia(true);
    audioRef.current?.openFilePicker();
  }, []);

  const handleReviewAudioReady = useCallback(async () => {
    setAudioReady(true);
    if (stepRef.current !== 4 || !release) return;
    setReplacingMedia(true);
    setError(null);
    try {
      const album = await catalog.getAlbum(release.albumId);
      await new Promise<void>((resolve, reject) => {
        queueMicrotask(() => {
          void (async () => {
            try {
              await audioRef.current?.triggerUpload(album.creator_id);
              resolve();
            } catch (err) {
              reject(err);
            }
          })();
        });
      });
      srtsp.audioUploaded({
        albumId: release.albumId,
        trackId: release.trackId,
        creatorId: album.creator_id,
        title: release.title,
      });
      const track = await catalog.getTrack(release.trackId);
      const files = await catalog.getTrackFiles(release.trackId);
      const primary = files.find((f) => f.is_primary) ?? files[0];
      if (primary) {
        const sizeMb = (primary.file_size_bytes ?? 0) / 1024 / 1024;
        setAudioFileInfo({
          fileName: primary.file_path.split("/").pop() ?? "audio",
          durationSeconds: track.duration_seconds ?? primary.duration_seconds ?? 0,
          format: primary.format,
          sizeLabel: `${sizeMb.toFixed(1)} Mo`,
        });
      }
    } catch (err) {
      setError(wizardErrorMessage(err, "Impossible de remplacer l'audio."));
    } finally {
      setReplacingMedia(false);
    }
  }, [catalog, release, srtsp]);

  const handleReviewCoverSuccess = useCallback(() => {
    invalidateCoverPreview();
    setReplacingMedia(false);
    if (!release) return;
    srtsp.coverUploaded({
      albumId: release.albumId,
      trackId: release.trackId,
      creatorId: release.creatorId,
      title: release.title,
    });
  }, [invalidateCoverPreview, release, srtsp]);

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
      srtsp.draftCreated({
        albumId: album.id,
        trackId: autoTrack.id,
        creatorId: album.creator_id,
        title: titleInput.trim(),
      });
      goToStep(2, {
        progressFlags: {
          hasRelease: true,
          filesCompleted,
          metadataCompleted,
        },
      });
    } catch (err) {
      setError(wizardErrorMessage(err, "Impossible de créer le morceau. Réessayez."));
    } finally {
      setCreating(false);
    }
  }, [catalog, titleInput, release, goToStep, srtsp, filesCompleted, metadataCompleted]);

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
      srtsp.audioUploaded({
        albumId: release.albumId,
        trackId: release.trackId,
        creatorId: effectiveCreatorId,
        title: release.title,
      });
      await coverRef.current.ensureCover({
        trackTitle: release.title,
        artistName: stageName,
        creatorId: effectiveCreatorId,
      });
      srtsp.coverUploaded({
        albumId: release.albumId,
        trackId: release.trackId,
        creatorId: effectiveCreatorId,
        title: release.title,
      });
      setFilesCompleted(true);
      goToStep(3, {
        progressFlags: {
          hasRelease: true,
          filesCompleted: true,
          metadataCompleted,
        },
      });
    } catch (err) {
      setError(wizardErrorMessage(err, "Erreur lors de l'envoi. Réessayez."));
    } finally {
      setUploading2(false);
    }
  }, [release, stageName, catalog, goToStep, filesCompleted, metadataCompleted, srtsp]);

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
    const wasResave = Boolean(savedMetaSnapshotRef.current);
    try {
      await catalog.saveWizardUserMetadata({
        trackId: release.trackId,
        genreId: meta.genreId,
        language: meta.language,
        lyrics: meta.lyrics.trim() || undefined,
        explicit: meta.explicit || undefined,
      });
      const ctx = {
        albumId: release.albumId,
        trackId: release.trackId,
        creatorId: release.creatorId,
        title: release.title,
      };
      if (wasResave) srtsp.draftUpdated(ctx);
      srtsp.metadataCompleted(ctx);
      savedMetaSnapshotRef.current = JSON.stringify(meta);
      setMetadataCompleted(true);
      goToStep(4, {
        progressFlags: {
          hasRelease: true,
          filesCompleted: true,
          metadataCompleted: true,
        },
      });
    } catch (err) {
      setError(wizardErrorMessage(err, "Impossible de sauvegarder. Réessayez."));
    } finally {
      setSavingMeta(false);
    }
  }, [catalog, release, meta, goToStep, metadataCompleted, srtsp]);

  const handlePublish = useCallback(async (): Promise<boolean> => {
    if (!release || publishingRef.current) return false;
    publishingRef.current = true;
    setPublishing(true);
    setError(null);
    try {
      await handleReviewMetaSave();
      const album = await catalog.getAlbum(release.albumId);
      await ensureAlbumHasCover(catalog, {
        albumId: release.albumId,
        creatorId: album.creator_id,
        trackTitle: release.title,
        artistName: stageName,
      });
      await catalog.submitAlbum(release.albumId);
      srtsp.submitted({
        albumId: release.albumId,
        trackId: release.trackId,
        creatorId: album.creator_id,
        title: release.title,
      });
      clearWizardSession();
      return true;
    } catch (err) {
      setError(wizardErrorMessage(err, "Impossible de publier. Réessayez."));
      return false;
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  }, [catalog, release, stageName, srtsp, handleReviewMetaSave]);

  return {
    step,
    release,
    titleInput,
    creating,
    audioRef,
    coverRef,
    audioReady,
    uploading2,
    genres,
    genresError,
    coverPreviewUrl,
    meta,
    savingMeta,
    savingReview,
    replacingMedia,
    audioFileInfo,
    audioInfoLoading,
    publishing,
    step2Mounted,
    error,
    uploadCreatorId,
    genreLabel,
    languageLabel,
    maxValidatedStep,
    setTitleInput,
    setAudioReady,
    setFilesCompleted,
    setMeta,
    filesCompleted,
    goToStep,
    goBack,
    loadGenres,
    invalidateCoverPreview,
    handleCreateRelease,
    handleContinueStep2,
    handleSaveMeta,
    handlePublish,
    handleReviewTitleSave,
    handleReviewMetaSave,
    handleReplaceCover,
    handleReplaceAudio,
    handleReviewAudioReady,
    handleReviewCoverSuccess,
  };
}
