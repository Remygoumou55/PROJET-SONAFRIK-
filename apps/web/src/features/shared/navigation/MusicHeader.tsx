"use client";

"use client";

import type { ReactNode } from "react";

interface MusicHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  left?: ReactNode;
  right?: ReactNode;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  menuControlsId?: string;
  className?: string;
}

export function MusicHeader({
  title,
  subtitle,
  eyebrow,
  left,
  right,
  menuOpen = false,
  onMenuToggle,
  menuControlsId,
  className = "",
}: MusicHeaderProps) {
  return (
    <header className={`music-header enterprise-header-card${className ? ` ${className}` : ""}`}>
      <div className="music-header__left">
        {onMenuToggle ? (
          <button
            type="button"
            className="music-header__menu-btn touch-target"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls={menuControlsId}
            onClick={onMenuToggle}
          >
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
        ) : null}
        {left}
        <div className="music-header__copy">
          {eyebrow ? <p className="music-header__eyebrow">{eyebrow}</p> : null}
          <h1 className="music-header__title">{title}</h1>
          {subtitle ? <p className="music-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {right ? <div className="music-header__right">{right}</div> : null}
    </header>
  );
}
