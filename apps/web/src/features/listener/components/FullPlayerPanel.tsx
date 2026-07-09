"use client";

import "@/app/styles/listen-home/full-player.css";
import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { useStreamQuality } from "../hooks/useStreamQuality";
import { LikeButton } from "@/features/shared/social/components/LikeButton";
import { FavoriteButton } from "@/features/shared/social/components/FavoriteButton";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext, usePlayerPosition } from "../lib/playerContext";
import { usePlayerMute, volumeIcon } from "../lib/playerMuteContext";
import { useListenFeatures } from "../lib/listenFeaturesContext";
import { useTrackListenCounts } from "../hooks/useTrackListenCounts";
import { useTrackReactions } from "../hooks/useTrackReactions";
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

const FullPlayerCreditsTab = dynamic(
  () => import("./FullPlayerCreditsTab").then((m) => ({ default: m.FullPlayerCreditsTab })),
  { ssr: false },
);

const FullPlayerCommunityTab = dynamic(
  () => import("./FullPlayerCommunityTab").then((m) => ({ default: m.FullPlayerCommunityTab })),
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
  { key: "details", label: "Détails", icon: "spark" },
  { key: "lyrics", label: "Paroles", icon: "lyrics" },
  { key: "credits", label: "Crédits", icon: "credits" },
  { key: "comments", label: "Avis", icon: "comments" },
  { key: "soutenir", label: "Soutenir", icon: "support" },
] as const;

const QUICK_REACTION_STORAGE_KEY = "sonafrik.track-panel.reaction.v3";

function formatYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const y = new Date(dateStr).getFullYear();
    return Number.isNaN(y) ? null : String(y);
  } catch {
    return null;
  }
}

function formatDateLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

function formatCompactCount(value: number | null | undefined): string {
  if (!value || value <= 0) return "0";
  return value.toLocaleString("fr-FR");
}

function readMetadataString(metadata: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function readMetadataNumber(metadata: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readMetadataBoolean(metadata: Record<string, unknown>, keys: readonly string[]): boolean {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  return false;
}

function qualityLabel(bitrate: number) {
  if (bitrate >= 128) return "Haute qualité";
  if (bitrate >= 96) return "Standard";
  return "Éco données";
}

function renderTabIcon(icon: (typeof MAIN_TABS)[number]["icon"]) {
  switch (icon) {
    case "spark":
      return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 1.8l1.2 3.2 3.2 1.2-3.2 1.2L8 10.6 6.8 7.4 3.6 6.2l3.2-1.2L8 1.8zM12.5 9.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9zM3.2 9.8l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" fill="currentColor" />
        </svg>
      );
    case "lyrics":
      return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 4.5h10M3 8h10M3 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "credits":
      return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5 3.5h6M4 6.5h8M4 9.5h5M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "comments":
      return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v4A1.5 1.5 0 0 1 11.5 10H8l-3.5 3v-3h0A1.5 1.5 0 0 1 3 8.5v-4z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 13.4s-4.3-2.7-4.3-6.1A2.3 2.3 0 0 1 8 5.8a2.3 2.3 0 0 1 4.3 1.5c0 3.4-4.3 6.1-4.3 6.1z" fill="currentColor" />
        </svg>
      );
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
  const { bitrate } = useStreamQuality();
  const { whatsappShare, queuePanel, synchronizedLyrics } = useListenFeatures();
  const listenCounts = useTrackListenCounts(currentTrack?.id);
  const { reactions, liveListeners } = useTrackReactions(currentTrack?.id ?? null);

  const [activeTab, setActiveTab] = useState<FullPlayerTab>("details");
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);

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
    }
  }, [isOpen]);

  const handleReaction = useCallback((emoji: string) => {
    setMyReaction((prev) => (prev === emoji ? null : emoji));
  }, []);

  useEffect(() => {
    if (!currentTrack?.id) return;
    try {
      const stored = window.localStorage.getItem(`${QUICK_REACTION_STORAGE_KEY}.${currentTrack.id}`);
      setMyReaction(stored || null);
    } catch {
      setMyReaction(null);
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack?.id) return;
    try {
      if (myReaction) {
        window.localStorage.setItem(`${QUICK_REACTION_STORAGE_KEY}.${currentTrack.id}`, myReaction);
      } else {
        window.localStorage.removeItem(`${QUICK_REACTION_STORAGE_KEY}.${currentTrack.id}`);
      }
    } catch {
      // UI enhancement only — ignore storage failures.
    }
  }, [currentTrack?.id, myReaction]);

  if (!isOpen || !currentTrack) return null;

  const artistLabel = currentTrack.artist_name ?? "Artiste";
  const artistHref = `/listen/artist/${currentTrack.creator_id}`;
  const releaseYear = formatYear(currentTrack.published_at ?? currentTrack.created_at);
  const releaseDate = formatDateLabel(currentTrack.published_at ?? currentTrack.created_at);
  const metadata = currentTrack.metadata ?? {};
  const isVerified = readMetadataBoolean(metadata, ["verified", "artist_verified", "is_verified"]);
  const genre = readMetadataString(metadata, ["genre", "genre_primary", "primary_genre"]) ?? "Afro";
  const subgenre = readMetadataString(metadata, ["subgenre", "genre_secondary", "secondary_genre"]);
  const composer = readMetadataString(metadata, ["composer", "compositeur"]);
  const author = readMetadataString(metadata, ["author", "auteur", "lyricist", "parolier"]);
  const label = readMetadataString(metadata, ["label", "label_name"]);
  const studio = readMetadataString(metadata, ["studio"]);
  const producer = readMetadataString(metadata, ["producer", "producteur"]);
  const beatmaker = readMetadataString(metadata, ["beatmaker"]);
  const mix = readMetadataString(metadata, ["mix", "mixage"]);
  const master = readMetadataString(metadata, ["master", "mastering"]);
  const language = currentTrack.language || readMetadataString(metadata, ["language", "langue"]) || "Français";
  const favoriteCount =
    readMetadataNumber(metadata, ["favorite_count", "favorites_count", "favoritesCount"]) ??
    reactions.find((reaction) => reaction.emoji === "❤️")?.count ??
    0;
  const playlistCount = readMetadataNumber(metadata, ["playlist_count", "playlists_count", "playlistCount"]) ?? 0;
  const shareCount = readMetadataNumber(metadata, ["share_count", "shares_count", "shareCount"]) ?? 0;
  const reviewCount = readMetadataNumber(metadata, ["review_count", "reviews_count", "reviewCount"]) ?? 0;
  const averageRating = readMetadataNumber(metadata, ["rating_average", "ratingAverage", "average_rating"]) ?? 0;
  const isrc = currentTrack.isrc ?? readMetadataString(metadata, ["isrc"]);
  const detailRows = [
    ["Artiste", artistLabel],
    ["Album", currentTrack.album_title],
    ["Genre", genre],
    ["Sous-genre", subgenre],
    ["Date", releaseDate],
    ["Année", releaseYear],
    ["Durée", currentTrack.duration_seconds ? formatTime(currentTrack.duration_seconds) : null],
    ["Qualité", `${qualityLabel(bitrate)} · ${bitrate} kbps`],
    ["ISRC", isrc],
    ["Compositeur", composer],
    ["Auteur", author],
    ["Label", label],
    ["Langue", language],
    ["Écoutes", formatCompactCount(listenCounts?.all_time)],
  ].filter(([, value]) => Boolean(value));
  const socialStats = [
    {
      label: "Avis",
      value: reviewCount > 0 ? formatCompactCount(reviewCount) : "Nouveau",
      accent: "community",
    },
    {
      label: "Écoutes",
      value: formatCompactCount(listenCounts?.all_time),
      accent: "listen",
    },
    {
      label: "Favoris",
      value: formatCompactCount(favoriteCount),
      accent: "favorite",
    },
    {
      label: "Playlists",
      value: formatCompactCount(playlistCount),
      accent: "playlist",
    },
  ];

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

            <div className="fpp-side-summary">
              <div className="fpp-track-header">
                <h2 className="fpp-title">{currentTrack.title}</h2>
                <div className="fpp-artist-line">
                  <Link href={artistHref} className="fpp-artist-link" onClick={onClose}>
                    {artistLabel}
                  </Link>
                  {isVerified ? <span className="fpp-verified-badge">Vérifié</span> : null}
                </div>
                <div className="fpp-meta-badges">
                  <span className="fpp-badge">{genre}</span>
                  {currentTrack.album_title ? (
                    <span className="fpp-badge fpp-badge--album">{currentTrack.album_title}</span>
                  ) : null}
                  {releaseYear ? <span className="fpp-badge">{releaseYear}</span> : null}
                  {currentTrack.duration_seconds ? (
                    <span className="fpp-badge">{formatTime(currentTrack.duration_seconds)}</span>
                  ) : null}
                  <span className="fpp-badge">{bitrate} kbps</span>
                  {currentTrack.explicit ? (
                    <span className="fpp-badge fpp-badge--explicit">E</span>
                  ) : null}
                </div>
              </div>

              <div className="fpp-side-stats">
                <div className="fpp-side-stat">
                  <span className="fpp-side-stat__value">{formatCompactCount(listenCounts?.all_time)}</span>
                  <span className="fpp-side-stat__label">écoutes</span>
                </div>
                <div className="fpp-side-stat">
                  <span className="fpp-side-stat__value">{formatCompactCount(favoriteCount)}</span>
                  <span className="fpp-side-stat__label">favoris</span>
                </div>
                <div className="fpp-side-stat">
                  <span className="fpp-side-stat__value">{formatCompactCount(playlistCount)}</span>
                  <span className="fpp-side-stat__label">playlists</span>
                </div>
                <div className="fpp-side-stat">
                  <span className="fpp-side-stat__value">{formatCompactCount(shareCount)}</span>
                  <span className="fpp-side-stat__label">partages</span>
                </div>
              </div>
            </div>

            <TrackListenStats trackId={currentTrack.id} />

            <div className="fpp-action-bar">
              <div className="fpp-action-chip">
                <LikeButton trackId={currentTrack.id} size="sm" showCount />
                <span>Favori</span>
              </div>
              <div className="fpp-action-chip">
                <FavoriteButton entityType="track" entityId={currentTrack.id} size="sm" />
                <span>Playlist</span>
              </div>
              <Link
                href={artistHref}
                className="fpp-action-chip"
                onClick={onClose}
                aria-label={`Voir le profil de ${artistLabel}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span>Voir l&apos;artiste</span>
              </Link>
              {whatsappShare ? (
                <div className="fpp-action-chip">
                  <ShareButton
                    trackId={currentTrack.id}
                    title={currentTrack.title}
                    artistName={artistLabel}
                    variant="icon"
                  />
                  <span>Partager</span>
                </div>
              ) : null}
              <button
                type="button"
                className={`fpp-action-chip fpp-action-chip--support${activeTab === "soutenir" ? " active" : ""}`}
                onClick={() => setActiveTab("soutenir")}
                aria-label={`Soutenir ${artistLabel}`}
              >
                <span className="fpp-action-chip__emoji" aria-hidden="true">💛</span>
                <span>Soutenir</span>
              </button>
            </div>
          </div>

          <div className="fpp-col-right">
            <header className="fpp-premium-header">
              <div className="fpp-premium-header__top">
                <div className="fpp-premium-header__copy">
                  <p className="fpp-panel-kicker">Track Experience Panel</p>
                  <h1 className="fpp-panel-title">{currentTrack.title}</h1>
                  <div className="fpp-panel-subline">
                    <Link href={artistHref} className="fpp-panel-artist" onClick={onClose}>
                      {artistLabel}
                    </Link>
                    {isVerified ? <span className="fpp-verified-badge">Vérifié</span> : null}
                    <span className="fpp-dot" aria-hidden="true" />
                    <span>{genre}</span>
                    {currentTrack.album_title ? (
                      <>
                        <span className="fpp-dot" aria-hidden="true" />
                        <span>{currentTrack.album_title}</span>
                      </>
                    ) : null}
                    {releaseDate ? (
                      <>
                        <span className="fpp-dot" aria-hidden="true" />
                        <span>{releaseDate}</span>
                      </>
                    ) : null}
                    {currentTrack.duration_seconds ? (
                      <>
                        <span className="fpp-dot" aria-hidden="true" />
                        <span>{formatTime(currentTrack.duration_seconds)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="fpp-panel-rating">
                  <div className="fpp-rating-stars fpp-rating-stars--display" aria-label={`Note moyenne ${averageRating || 0} sur 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`fpp-star${averageRating >= star - 0.4 ? " fpp-star--filled" : ""}`}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="fpp-panel-rating__value">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</span>
                  <span className="fpp-panel-rating__count">{formatCompactCount(reviewCount)} avis</span>
                </div>
              </div>

              <div className="fpp-social-proof" aria-label="Preuve sociale du morceau">
                {socialStats.map((stat) => (
                  <div key={stat.label} className={`fpp-proof-card fpp-proof-card--${stat.accent}`}>
                    <span className="fpp-proof-card__value">{stat.value}</span>
                    <span className="fpp-proof-card__label">{stat.label}</span>
                  </div>
                ))}
              </div>

              {liveListeners > 0 ? (
                <div className="fpp-live-pulse" role="status" aria-live="polite">
                  <span className="fpp-live-pulse__dot" aria-hidden="true" />
                  <span>{liveListeners} auditeurs sont en train d&apos;écouter ce morceau</span>
                </div>
              ) : null}
            </header>

            <div className="fpp-player-shell">
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
                <div className="fpp-volume-meta">
                  <span>{qualityLabel(bitrate)}</span>
                  <span>{bitrate} kbps</span>
                </div>
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
            </div>

            <div className="fpp-quick-reactions-wrap">
              <div className="fpp-section-head fpp-section-head--inline">
                <div>
                  <p className="fpp-section-head__eyebrow">Réactions rapides</p>
                  <h3 className="fpp-section-head__title">Exprimez votre vibe</h3>
                </div>
              </div>
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
                    <span className="fpp-quick-reaction-btn__emoji" aria-hidden="true">{r.emoji}</span>
                    <span className="fpp-quick-reaction-btn__label">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="fpp-tabs" role="tablist" aria-label="Sections du lecteur">
              {MAIN_TABS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`fpp-tab${activeTab === key ? " active" : ""}`}
                  onClick={() => setActiveTab(key as FullPlayerTab)}
                >
                  <span className="fpp-tab__icon">{renderTabIcon(icon)}</span>
                  <span className="fpp-tab__label">{label}</span>
                </button>
              ))}
            </div>

            <div className="fpp-tab-panel" role="tabpanel">
              {activeTab === "details" ? (
                <div className="fpp-details-layout">
                  <dl className="fpp-details-table">
                    {detailRows.map(([labelText, value]) => (
                      <div key={labelText} className="fpp-detail-row">
                        <dt className="fpp-details-label">{labelText}</dt>
                        <dd
                          className={`fpp-details-value${
                            labelText === "ISRC" ? " fpp-details-value--mono" : ""
                          }${labelText === "Langue" ? " fpp-details-value--cap" : ""}`}
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <aside className="fpp-detail-aside">
                    <section className="fpp-detail-card">
                      <p className="fpp-detail-card__eyebrow">Signature sonore</p>
                      <h3 className="fpp-detail-card__title">{genre}{subgenre ? ` · ${subgenre}` : ""}</h3>
                      <p className="fpp-detail-card__text">
                        {currentTrack.explicit
                          ? "Version explicite avec une identité forte et une texture premium."
                          : "Une proposition musicale conçue pour une écoute fluide, immersive et premium."}
                      </p>
                    </section>

                    <section className="fpp-detail-card">
                      <p className="fpp-detail-card__eyebrow">Fabrication</p>
                      <ul className="fpp-mini-list">
                        {producer ? <li>Producteur : {producer}</li> : null}
                        {beatmaker ? <li>Beatmaker : {beatmaker}</li> : null}
                        {mix ? <li>Mix : {mix}</li> : null}
                        {master ? <li>Master : {master}</li> : null}
                        {studio ? <li>Studio : {studio}</li> : null}
                        {label ? <li>Label : {label}</li> : null}
                      </ul>
                    </section>
                  </aside>
                </div>
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
                <FullPlayerCreditsTab trackId={currentTrack.id} />
              ) : null}

              {activeTab === "comments" ? (
                <FullPlayerCommunityTab
                  trackId={currentTrack.id}
                  trackTitle={currentTrack.title}
                  artistName={artistLabel}
                />
              ) : null}

              {activeTab === "soutenir" ? (
                <div className="fpp-tip-panel fpp-support-panel">
                  <div className="fpp-section-head">
                    <div>
                      <p className="fpp-section-head__eyebrow">Soutien direct</p>
                      <h3 className="fpp-section-head__title">Soutenir l&apos;artiste</h3>
                    </div>
                  </div>
                  <TipPanel
                    creatorId={currentTrack.creator_id}
                    artistName={artistLabel}
                    variant="full"
                  />
                  <p className="fpp-tip-note">
                    Votre contribution aide directement l&apos;artiste à continuer de créer. Le paiement est
                    effectué depuis votre Wallet SONAFRIK.{" "}
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
