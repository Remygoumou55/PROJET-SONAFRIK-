"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "welcome_shown_creator";

interface WelcomeModalProps {
  stageName: string;
  profileCreatedAt: string;
}

function firstName(stageName: string): string {
  return stageName.split(/\s+/)[0] ?? stageName;
}

function isRecentAccount(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const hours48 = 48 * 60 * 60 * 1000;
  return Date.now() - created < hours48;
}

export function WelcomeModal({ stageName, profileCreatedAt }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    if (!isRecentAccount(profileCreatedAt)) return;
    setOpen(true);
  }, [profileCreatedAt]);

  function close() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="creator-welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="creator-welcome-modal">
        <h2 id="welcome-title" className="creator-welcome-modal__title">
          Bienvenue sur SONAFRIK, {firstName(stageName)} 🎵
        </h2>
        <p className="creator-welcome-modal__subtitle">Votre espace artiste est prêt.</p>

        <ul className="creator-welcome-modal__features">
          <li>🎵 Publiez votre musique</li>
          <li>💰 Recevez vos royalties</li>
          <li>🏆 Développez votre carrière</li>
        </ul>

        <p className="creator-welcome-modal__message">
          65 % de chaque écoute vous revient directement.
          Commençons par publier votre premier morceau.
        </p>

        <Link href="/creator/catalog/tracks" className="creator-welcome-modal__primary" onClick={close}>
          Publier mon premier titre
        </Link>
        <button type="button" className="creator-welcome-modal__secondary" onClick={close}>
          Explorer d&apos;abord
        </button>
      </div>
    </div>
  );
}
