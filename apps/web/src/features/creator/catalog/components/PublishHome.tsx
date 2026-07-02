"use client";

import { useState } from "react";
import { PublicationWizard } from "./PublicationWizard";

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

// ─── Component ────────────────────────────────────────────────────────────────

export function PublishHome({
  creatorId,
  stageName,
}: {
  creatorId: string;
  stageName: string;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);

  if (wizardOpen) {
    return (
      <PublicationWizard
        creatorId={creatorId}
        stageName={stageName}
        onComplete={() => { setWizardOpen(false); window.location.reload(); }}
        onCancel={() => setWizardOpen(false)}
      />
    );
  }

  return (
    <div className="pub-home">
      <div className="pub-home__grid">

        {/* ── Ligne 1, Col 1 — Publiez votre prochain morceau ── */}
        <div className="pub-home-hero" role="banner">
          <div className="pub-home-hero__content">
            <div className="pub-home-hero__icon" aria-hidden="true">🎵</div>
            <h2 className="pub-home-hero__title">Publiez votre prochain morceau</h2>
            <p className="pub-home-hero__sub">
              Diffusez votre musique sur SONAFRIK, développez votre communauté partout dans le monde
              et gagnez des revenus grâce aux écoutes de vos fans.
            </p>
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

        {/* ── Ligne 1, Col 2 — Publication rapide ── */}
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

        {/* ── Ligne 2, Col 1 — Pourquoi publier sur SONAFRIK ── */}
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
                <p className="pub-home-why__item-title" style={{ color: item.color }}>
                  {item.title}
                </p>
                <p className="pub-home-why__item-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ligne 2, Col 2 — Coach SONAFRIK ── */}
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
              <p className="pub-home-coach__greeting">Bonjour {stageName} ! 👋</p>
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
            Voir le guide →
          </button>
        </div>

      </div>
    </div>
  );
}
