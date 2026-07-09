"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/features/shared/social/components/LikeButton";
import { FavoriteButton } from "@/features/shared/social/components/FavoriteButton";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext, usePlayerPosition } from "../lib/playerContext";
import { usePlayerMute, volumeIcon } from "../lib/playerMuteContext";
import { useListenFeatures } from "../lib/listenFeaturesContext";
import { PlayerControls } from "./PlayerControls";
import { TipPanel } from "./TipPanel";
import {
  TrackListenStats,
  FullPlayerProgress,
  QueueOverlay,
} from "./FullPlayerSubComponents";
import { formatTime } from "./PlayerProgressBar";

const ShareButton = dynamic(
  () => import("./ShareButton").then((m) => ({ default: m.ShareButton })),
  { ssr: false },
);

const LyricsPanel = dynamic(
  () => import("./LyricsPanel").then((m) => ({ default: m.LyricsPanel })),
  { ssr: false },
);

type FullPlayerTab = "details" | "lyrics" | "credits" | "comments" | "soutenir";

const QUICK_REACTIONS = [
  { emoji: "🔥", label: "Incroyable" },
  { emoji: "❤️", label: "J'adore" },
  { emoji: "🎶", label: "En boucle" },
  { emoji: "👏", label: "Bravo" },
  { emoji: "🇬🇳", label: "Fier de chez nous" },
] as const;

const MAIN_TABS = [
  { key: "details", label: "Détails" },
  { key: "lyrics", label: "Paroles" },
  { key: "credits", label: "Crédits" },
  { key: "comments", label: "Avis" },
] as const;

function formatYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const y = new Date(dateStr).getFullYear();
    return Number.isNaN(y) ? null : String(y);
  } catch {
    return null;
  }
}

/** Isolated sub-component — subscribes to high-freq position context so FullPlayerPanel doesn't re-render at 4 Hz */
function LyricsPanelConnected({ trackId }: { trackId: string }) {
  const currentPosition = usePlayerPosition();
  return <LyricsPanel trackId={trackId} currentTime={currentPosition} />;
}

interface FullPlayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullPlayerPanel = memo(function FullPlayerPanel({
  isOpen,
  onClose,
}: FullPlayerPanelProps) {
  const { currentTrack, isPlaying, pauseAndSave, resume } = usePlayer();
  const { volume } = usePlayerContext();
  const { isMuted, toggleMute, handleVolumeChange } = usePlayerMute();
  const { whatsappShare, queuePanel, synchronizedLyrics } = useListenFeatures();

  const [activeTab, setActiveTab] = useState<FullPlayerTab>("details");
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        if (isPlaying) void pauseAndSave();
        else resume();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isPlaying, pauseAndSave, resume]);

  useEffect(() => {
    if (!isOpen) {
      setIsQueueOpen(false);
      setActiveTab("details");
      setMyReaction(null);
      setCommentText("");
      setMyRating(0);
      setRatingHover(0);
    }
  }, [isOpen]);

  const handleReaction = useCallback((emoji: string) => {
    setMyReaction((prev) => (prev === emoji ? null : emoji));
  }, []);

  if (!isOpen || !currentTrack) return null;

  const artistLabel = currentTrack.artist_name ?? "Artiste";
  const artistHref = `/listen/artist/${currentTrack.creator_id}`;
  const releaseYear = formatYear(currentTrack.published_at ?? currentTrack.created_at);

  return (
    <>
      <div className="fpp-overlay" onClick={onClose} aria-hidden="true" />

      <div
        className="fpp-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Lecteur — ${currentTrack.title}`}
      >
        <div className="fpp-bg" aria-hidden="true" />

        <button
          type="button"
          className="fpp-close"
          onClick={onClose}
          aria-label="Fermer le lecteur"
        >
          ✕
        </button>

        <div className="fpp-grid">
          {/* ─── COLONNE GAUCHE ─── */}
          <div className="fpp-col-left">
            <div className="fpp-cover-wrap">
              <div className={`fpp-cover${isPlaying ? " fpp-cover--playing" : ""}`}>
                <CoverImage
                  coverPath={currentTrack.cover_url ?? null}
                  alt={currentTrack.title}
                  artistName={artistLabel}
                  imgSizes="(max-width: 699px) 96px, 200px"
                  priority
                />
              </div>
            </div>

            <div className="fpp-track-header">
              <h2 className="fpp-title">{currentTrack.title}</h2>
              <Link href={artistHref} className="fpp-artist-link" onClick={onClose}>
                {artistLabel}
              </Link>
              <div className="fpp-meta-badges">
                {currentTrack.album_title ? (
                  <span className="fpp-badge fpp-badge--album">{currentTrack.album_title}</span>
                ) : null}
                {releaseYear ? <span className="fpp-badge">{releaseYear}</span> : null}
                {currentTrack.explicit ? (
                  <span className="fpp-badge fpp-badge--explicit">E</span>
                ) : null}
              </div>
            </div>

            <TrackListenStats trackId={currentTrack.id} />

            <div className="fpp-action-bar">
              <LikeButton trackId={currentTrack.id} size="sm" />
              <FavoriteButton entityType="track" entityId={currentTrack.id} size="sm" />
              {whatsappShare ? (
                <ShareButton
                  trackId={currentTrack.id}
                  title={currentTrack.title}
                  artistName={artistLabel}
                  variant="icon"
                />
              ) : null}
              <Link
                href={artistHref}
                className="fpp-action-icon-btn"
                onClick={onClose}
                aria-label={`Voir le profil de ${artistLabel}`}
                title={`Voir ${artistLabel}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </Link>
              <button
                type="button"
                className={`fpp-action-icon-btn fpp-action-icon-btn--soutenir${activeTab === "soutenir" ? " active" : ""}`}
                onClick={() => setActiveTab("soutenir")}
                aria-label={`Soutenir ${artistLabel}`}
                title="Soutenir l'artiste"
              >
                <span aria-hidden="true">💛</span>
              </button>
            </div>
          </div>

          {/* ─── COLONNE DROITE ─── */}
          <div className="fpp-col-right">
            <FullPlayerProgress />

            <div className="fpp-controls">
              <PlayerControls />
            </div>

            <div className="fpp-volume-row">
              <button
                type="button"
                className={`fpp-vol-mute${isMuted ? " muted" : ""}`}
                onClick={toggleMute}
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
                aria-pressed={isMuted}
              >
                {volumeIcon(isMuted, volume)}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={(event) => handleVolumeChange(Number(event.target.value))}
                className="fpp-vol-slider"
                aria-label="Volume"
              />
              {queuePanel ? (
                <button
                  type="button"
                  className="fpp-queue-btn"
                  onClick={() => setIsQueueOpen(true)}
                  aria-label="File d'attente"
                  title="File d'attente"
                >
                  <svg width="15" height="13" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
                    <rect x="0" y="0" width="15" height="2" rx="1" />
                    <rect x="0" y="5.5" width="11" height="2" rx="1" />
                    <rect x="0" y="11" width="8" height="2" rx="1" />
                  </svg>
                </button>
              ) : null}
            </div>

            {/* Quick reactions */}
            <div className="fpp-quick-reactions" role="group" aria-label="Réactions rapides">
              {QUICK_REACTIONS.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  className={`fpp-quick-reaction-btn${myReaction === r.emoji ? " active" : ""}`}
                  onClick={() => handleReaction(r.emoji)}
                  aria-label={r.label}
                  aria-pressed={myReaction === r.emoji}
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>

            {/* Tab bar */}
            <div className="fpp-tabs" role="tablist" aria-label="Sections du lecteur">
              {MAIN_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`fpp-tab${activeTab === key ? " active" : ""}`}
                  onClick={() => setActiveTab(key as FullPlayerTab)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "soutenir"}
                className={`fpp-tab fpp-tab--soutenir${activeTab === "soutenir" ? " active" : ""}`}
                onClick={() => setActiveTab("soutenir")}
              >
                💛
              </button>
            </div>

            {/* Tab content */}
            <div className="fpp-tab-panel" role="tabpanel">
              {activeTab === "details" ? (
                <dl className="fpp-details-table">
                  {currentTrack.album_title ? (
                    <>
                      <dt className="fpp-details-label">Album</dt>
                      <dd className="fpp-details-value">{currentTrack.album_title}</dd>
                    </>
                  ) : null}
                  {releaseYear ? (
                    <>
                      <dt className="fpp-details-label">Année</dt>
                      <dd className="fpp-details-value">{releaseYear}</dd>
                    </>
                  ) : null}
                  {currentTrack.duration_seconds ? (
                    <>
                      <dt className="fpp-details-label">Durée</dt>
                      <dd className="fpp-details-value">{formatTime(currentTrack.duration_seconds)}</dd>
                    </>
                  ) : null}
                  {currentTrack.language ? (
                    <>
                      <dt className="fpp-details-label">Langue</dt>
                      <dd className="fpp-details-value fpp-details-value--cap">{currentTrack.language}</dd>
                    </>
                  ) : null}
                  {currentTrack.bpm ? (
                    <>
                      <dt className="fpp-details-label">BPM</dt>
                      <dd className="fpp-details-value">{currentTrack.bpm}</dd>
                    </>
                  ) : null}
                  {currentTrack.musical_key ? (
                    <>
                      <dt className="fpp-details-label">Tonalité</dt>
                      <dd className="fpp-details-value">{currentTrack.musical_key}</dd>
                    </>
                  ) : null}
                  {currentTrack.isrc ? (
                    <>
                      <dt className="fpp-details-label">ISRC</dt>
                      <dd className="fpp-details-value fpp-details-value--mono">{currentTrack.isrc}</dd>
                    </>
                  ) : null}
                  {currentTrack.explicit ? (
                    <>
                      <dt className="fpp-details-label">Contenu</dt>
                      <dd className="fpp-details-value">Explicite</dd>
                    </>
                  ) : null}
                </dl>
              ) : null}

              {activeTab === "lyrics" ? (
                <div className="fpp-lyrics-inline">
                  {synchronizedLyrics ? (
                    <LyricsPanelConnected trackId={currentTrack.id} />
                  ) : (
                    <div className="fpp-empty-state">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
                      </svg>
                      <p>Les paroles ne sont pas encore disponibles pour ce morceau.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "credits" ? (
                <div className="fpp-empty-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p>Les crédits de ce morceau n&apos;ont pas encore été renseignés par l&apos;artiste.</p>
                </div>
              ) : null}

              {activeTab === "comments" ? (
                <div className="fpp-comments-section">
                  <div className="fpp-rating-overview">
                    <div className="fpp-rating-stars fpp-rating-stars--display" aria-label="Note moyenne : aucun avis">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="fpp-star" aria-hidden="true">★</span>
                      ))}
                    </div>
                    <span className="fpp-rating-label">0 avis</span>
                  </div>

                  <div className="fpp-comment-form">
                    <p className="fpp-comment-prompt">Qu&apos;as-tu pensé de ce morceau ?</p>
                    <div
                      className="fpp-rating-stars fpp-rating-stars--interactive"
                      role="group"
                      aria-label="Donner une note sur 5 étoiles"
                      onMouseLeave={() => setRatingHover(0)}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`fpp-star-btn${s <= (ratingHover || myRating) ? " active" : ""}`}
                          onClick={() => setMyRating(s === myRating ? 0 : s)}
                          onMouseEnter={() => setRatingHover(s)}
                          aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                          aria-pressed={s <= myRating}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="fpp-comment-input"
                      placeholder="Partage ton ressenti…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      maxLength={500}
                      aria-label="Ton commentaire"
                    />
                    <button
                      type="button"
                      className="fpp-comment-submit"
                      disabled={myRating === 0 && commentText.trim().length === 0}
                    >
                      Publier
                    </button>
                  </div>

                  <div className="fpp-empty-state fpp-empty-state--sm">
                    <p>Sois le premier à laisser un avis sur ce morceau.</p>
                  </div>
                </div>
              ) : null}

              {activeTab === "soutenir" ? (
                <div className="fpp-tip-panel">
                  <TipPanel
                    creatorId={currentTrack.creator_id}
                    artistName={artistLabel}
                    variant="full"
                  />
                  <p className="fpp-tip-note">
                    Le pourboire est envoyé directement à l&apos;artiste depuis votre wallet SONAFRIK.{" "}
                    <Link href="/wallet" className="fpp-tip-wallet-link" onClick={onClose}>
                      Voir mon wallet
                    </Link>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <QueueOverlay isOpen={isQueueOpen && queuePanel} onClose={() => setIsQueueOpen(false)} />
    </>
  );
});
