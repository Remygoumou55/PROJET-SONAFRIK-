"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types/catalog";
import { PublicationWizard } from "./PublicationWizard";

const AudioUploader = dynamic(
  () => import("./AudioUploader").then((m) => ({ default: m.AudioUploader })),
  { ssr: false, loading: () => <p className="text-texte-desactive text-xs">Chargement…</p> },
);

const CreditsEditor = dynamic(
  () => import("./CreditsEditor").then((m) => ({ default: m.CreditsEditor })),
  { ssr: false, loading: () => <p className="text-texte-desactive text-xs">Chargement…</p> },
);

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_ITEMS = [
  {
    icon: "📋",
    iconColor: "var(--color-vert-energie)",
    title: "4 étapes simples",
    desc: "Audio, pochette, infos et c'est publié.",
  },
  {
    icon: "⏱",
    iconColor: "var(--color-or-solaire)",
    title: "3 à 5 minutes",
    desc: "Publiez votre morceau rapidement.",
  },
  {
    icon: "😊",
    iconColor: "var(--color-accent-violet)",
    title: "100% guidé",
    desc: "Nous vous accompagnons à chaque étape.",
  },
  {
    icon: "🛡",
    iconColor: "var(--color-info)",
    title: "Zéro stress",
    desc: "On s'occupe de la technique. Concentrez-vous sur votre art.",
  },
];

const WHY_ITEMS = [
  {
    icon: "💰",
    iconBg: "rgba(0,210,106,0.12)",
    color: "var(--color-vert-energie)",
    title: "Revenus équitables",
    desc: "Gardez 65% de vos revenus. Nous respectons les artistes.",
  },
  {
    icon: "📊",
    iconBg: "rgba(168,85,247,0.12)",
    color: "var(--color-accent-violet)",
    title: "Analytics avancées",
    desc: "Suivez votre audience et vos performances en temps réel.",
  },
  {
    icon: "🌍",
    iconBg: "rgba(59,130,246,0.12)",
    color: "var(--color-info)",
    title: "Distribution mondiale",
    desc: "Votre musique disponible sur SONAFRIK partout dans le monde.",
  },
  {
    icon: "💳",
    iconBg: "rgba(249,115,22,0.12)",
    color: "var(--color-accent-orange)",
    title: "Paiements rapides",
    desc: "Retirez vos revenus facilement et rapidement.",
  },
];

// ─── Track card (publications list) ──────────────────────────────────────────

function TrackCard({
  track,
  creatorId,
  stageName,
  expandedAudio,
  expandedCredits,
  onExpandAudio,
  onCollapseAudio,
  onToggleCredits,
  onAudioSuccess,
}: {
  track: Track;
  creatorId: string;
  stageName: string;
  expandedAudio: string | null;
  expandedCredits: string | null;
  onExpandAudio: (id: string) => void;
  onCollapseAudio: () => void;
  onToggleCredits: (id: string) => void;
  onAudioSuccess: (trackId: string, dur: number) => void;
}) {
  return (
    <div className="pub-home-track">
      <div className="pub-home-track__top">
        <div className="pub-home-track__info">
          <p className="pub-home-track__title">{track.title}</p>
          <span className="pub-home-track__status">
            {PUBLICATION_STATUS_LABELS[track.publication_status]}
          </span>
        </div>
        <div className="pub-home-track__meta">
          {track.isrc && <span className="pub-home-track__isrc">ISRC · {track.isrc}</span>}
          {track.duration_seconds ? (
            <span className="pub-home-track__dur">
              {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
            </span>
          ) : null}
        </div>
      </div>

      {expandedAudio === track.id ? (
        <div className="pub-home-track__upload">
          <AudioUploader
            trackId={track.id}
            creatorId={creatorId}
            onSuccess={(dur) => onAudioSuccess(track.id, dur)}
          />
          <button
            className="pub-home-track__action pub-home-track__action--muted"
            onClick={onCollapseAudio}
          >
            Fermer
          </button>
        </div>
      ) : (
        <div className="pub-home-track__actions">
          <button
            className="pub-home-track__action pub-home-track__action--primary"
            onClick={() => onExpandAudio(track.id)}
          >
            {track.duration_seconds ? "Remplacer le fichier audio" : "Ajouter le fichier audio"}
          </button>
          <button
            className="pub-home-track__action pub-home-track__action--secondary"
            onClick={() => onToggleCredits(track.id)}
          >
            Crédits
          </button>
        </div>
      )}

      {expandedCredits === track.id && (
        <CreditsEditor
          trackId={track.id}
          stageName={stageName}
          onClose={() => onToggleCredits(track.id)}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublishHome({
  tracks: initial,
  creatorId,
  stageName,
}: {
  tracks: Track[];
  creatorId: string;
  stageName: string;
}) {
  const [tracks, setTracks] = useState(initial);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null);
  const [expandedCredits, setExpandedCredits] = useState<string | null>(null);

  function handleWizardComplete() {
    setWizardOpen(false);
    window.location.reload();
  }

  if (wizardOpen) {
    return (
      <PublicationWizard
        creatorId={creatorId}
        stageName={stageName}
        onComplete={handleWizardComplete}
        onCancel={() => setWizardOpen(false)}
      />
    );
  }

  return (
    <div className="pub-home">
      <div className="pub-home__grid">
        {/* ── Main column ── */}
        <div className="pub-home__main">

          {/* Hero */}
          <div className="pub-home-hero" role="banner">
            <div className="pub-home-hero__content">
              <div className="pub-home-hero__icon" aria-hidden="true">🎵</div>
              <h2 className="pub-home-hero__title">Publiez votre prochain morceau</h2>
              <p className="pub-home-hero__sub">
                Diffusez votre musique sur SONAFRIK et touchez des fans partout dans le monde.
              </p>
              <div className="pub-home-hero__badges" aria-label="Points clés">
                <span className="pub-home-hero__badge">
                  <span className="pub-home-hero__badge-dot" aria-hidden="true">✅</span>
                  4 étapes simples
                </span>
                <span className="pub-home-hero__badge">
                  <span className="pub-home-hero__badge-dot" aria-hidden="true">⏱</span>
                  Temps estimé : 3 à 5 minutes
                </span>
                <span className="pub-home-hero__badge">
                  <span className="pub-home-hero__badge-dot" aria-hidden="true">✨</span>
                  Aucune connaissance technique
                </span>
              </div>
              <div className="pub-home-hero__actions">
                <button
                  className="pub-home-hero__cta"
                  onClick={() => setWizardOpen(true)}
                  aria-label="Publier un nouveau morceau"
                >
                  + Publier un nouveau morceau
                </button>
                <span className="pub-home-hero__cursive" aria-hidden="true">
                  Commençons
                </span>
              </div>
            </div>
            <div className="pub-home-hero__art" aria-hidden="true">
              <div className="pub-home-hero__art-glow" />
              <div className="pub-home-hero__art-figure">🎤</div>
              <div className="pub-home-hero__art-ring pub-home-hero__art-ring--1" />
              <div className="pub-home-hero__art-ring pub-home-hero__art-ring--2" />
            </div>
          </div>

          {/* Vos publications */}
          <section className="pub-home-pubs" aria-label="Vos publications">
            <div className="pub-home-pubs__header">
              <span className="pub-home-pubs__header-icon" aria-hidden="true">📋</span>
              <h3 className="pub-home-pubs__title">Vos publications</h3>
            </div>

            {tracks.length === 0 ? (
              <div className="pub-home-pubs__empty">
                <div className="pub-home-pubs__empty-art" aria-hidden="true">
                  <span className="pub-home-pubs__empty-art-icon">🎵</span>
                  <span className="pub-home-pubs__empty-art-star pub-home-pubs__empty-art-star--1">✦</span>
                  <span className="pub-home-pubs__empty-art-star pub-home-pubs__empty-art-star--2">✦</span>
                  <span className="pub-home-pubs__empty-art-star pub-home-pubs__empty-art-star--3">✦</span>
                </div>
                <p className="pub-home-pubs__empty-title">
                  Vous n&apos;avez encore publié aucun morceau.
                </p>
                <p className="pub-home-pubs__empty-sub">Votre premier morceau apparaîtra ici.</p>
                <button
                  className="pub-home-pubs__empty-cta"
                  onClick={() => setWizardOpen(true)}
                >
                  + Publier votre premier morceau
                </button>
              </div>
            ) : (
              <div className="pub-home-pubs__list">
                {tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    creatorId={creatorId}
                    stageName={stageName}
                    expandedAudio={expandedAudio}
                    expandedCredits={expandedCredits}
                    onExpandAudio={(id) => setExpandedAudio(id)}
                    onCollapseAudio={() => setExpandedAudio(null)}
                    onToggleCredits={(id) => setExpandedCredits((prev) => (prev === id ? null : id))}
                    onAudioSuccess={(trackId, dur) => {
                      setExpandedAudio(null);
                      setTracks((curr) =>
                        curr.map((t) => t.id === trackId ? { ...t, duration_seconds: dur } : t),
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Pourquoi publier */}
          <section className="pub-home-why" aria-label="Pourquoi publier sur SONAFRIK ?">
            <div className="pub-home-why__header">
              <span className="pub-home-why__header-icon" aria-hidden="true">⭐</span>
              <h3 className="pub-home-why__title">Pourquoi publier sur SONAFRIK ?</h3>
            </div>
            <div className="pub-home-why__grid">
              {WHY_ITEMS.map((item) => (
                <div key={item.title} className="pub-home-why__item">
                  <div
                    className="pub-home-why__item-icon"
                    style={{ background: item.iconBg }}
                    aria-hidden="true"
                  >
                    <span>{item.icon}</span>
                  </div>
                  <p
                    className="pub-home-why__item-title"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </p>
                  <p className="pub-home-why__item-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right aside ── */}
        <aside className="pub-home__aside" aria-label="Informations">

          {/* Publication rapide */}
          <div className="pub-home-quick">
            <div className="pub-home-quick__header">
              <h3 className="pub-home-quick__title">Publication rapide</h3>
              <span className="pub-home-quick__icon" aria-hidden="true">🚀</span>
            </div>
            <ul className="pub-home-quick__list" role="list">
              {QUICK_ITEMS.map((item) => (
                <li key={item.title} className="pub-home-quick__item">
                  <div
                    className="pub-home-quick__item-icon"
                    style={{ color: item.iconColor }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </div>
                  <div className="pub-home-quick__item-body">
                    <p className="pub-home-quick__item-title">{item.title}</p>
                    <p className="pub-home-quick__item-desc">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Coach SONAFRIK */}
          <div className="pub-home-coach">
            <div className="pub-home-coach__header">
              <h3 className="pub-home-coach__title">Coach SONAFRIK</h3>
              <span className="pub-home-coach__icon" aria-hidden="true">🎧</span>
            </div>
            <div className="pub-home-coach__body">
              <div className="pub-home-coach__avatar" aria-hidden="true">
                <span className="pub-home-coach__avatar-figure">🎤</span>
                <div className="pub-home-coach__avatar-ring" />
              </div>
              <div className="pub-home-coach__text">
                <p className="pub-home-coach__greeting">
                  Bonjour {stageName} ! 👋
                </p>
                <p className="pub-home-coach__question">
                  Prêt à partager votre talent avec le monde ?
                </p>
                <p className="pub-home-coach__tip">
                  Les artistes qui publient régulièrement développent plus vite leur audience
                  et leurs revenus.
                </p>
              </div>
            </div>
            <button
              className="pub-home-coach__cta"
              onClick={() => setWizardOpen(true)}
            >
              Commencer maintenant →
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
