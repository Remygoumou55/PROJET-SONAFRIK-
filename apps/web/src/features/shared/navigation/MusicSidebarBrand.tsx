"use client";

import { SONAFRIK_BRAND } from "@sonafrik/types";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import type { MusicNavRole } from "./musicNavTypes";

interface Props {
  role: MusicNavRole;
  /** Sous-titre sous le logo — défaut : slogan officiel */
  subtitle?: string;
}

/** Lockup sidebar — logo + slogan aligné sous la largeur du logo. */
export function MusicSidebarBrand({ role: _role, subtitle }: Props) {
  const contextLabel = subtitle ?? SONAFRIK_BRAND.slogan;

  return (
    <div className="music-sidebar__brand">
      <div className="ds-brand-lockup">
        <SonafrikLogo
          variant="full"
          size="sm"
          showTagline={false}
          priority
          className="ds-brand-lockup__logo"
        />
        <span className="ds-brand-lockup__context">{contextLabel}</span>
      </div>
    </div>
  );
}
