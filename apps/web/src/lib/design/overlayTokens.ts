/**
 * Overlays design — références vers @theme globals.css uniquement.
 * Vague D : zéro rgba hardcodé dans les composants features/.
 */
import type { RightsClaimStatus, RightsClaimType, WithdrawalStatus } from "@sonafrik/types";

export const OVERLAY = {
  vertSoft: "var(--overlay-vert-soft)",
  vertNav: "var(--overlay-vert-nav)",
  vertRow: "var(--overlay-vert-row)",
  vert04: "var(--overlay-vert-04)",
  erreurSoft: "var(--overlay-erreur-soft)",
  erreur09: "var(--overlay-erreur-09)",
  orSoft: "var(--overlay-or-soft)",
  bleuSoft: "var(--overlay-bleu-soft)",
  neutreSoft: "var(--overlay-neutre-soft)",
  avertissementSoft: "var(--overlay-avertissement-soft)",
  violetSoft: "var(--overlay-violet-soft)",
  noir50: "var(--overlay-noir-50)",
  noir70: "var(--overlay-noir-70)",
  noir75: "var(--overlay-noir-75)",
  modalBackdrop: "var(--overlay-modal-backdrop)",
  vertBorder: "var(--color-vert-energie-ring)",
  erreur25: "var(--overlay-erreur-25)",
  noir40: "var(--overlay-noir-40)",
  noir45: "var(--overlay-noir-45)",
  noir55: "var(--overlay-noir-55)",
  noir60: "var(--overlay-noir-60)",
  scrimCrop: "var(--overlay-scrim-crop)",
  blanc30: "var(--overlay-blanc-30)",
  texteSoft: "var(--overlay-texte-soft)",
  vert10: "var(--overlay-vert-10)",
} as const;

export const ERROR_BANNER_STYLE = {
  background: OVERLAY.erreur09,
  color: "var(--color-erreur)",
  border: `1px solid ${OVERLAY.erreur25}`,
} as const;

export const GENRE_CHIP_COLORS = [
  { bg: "var(--badge-genre-vert-bg)", text: "var(--color-vert-energie)", border: "var(--badge-genre-vert-border)" },
  { bg: "var(--badge-genre-or-bg)", text: "var(--color-or-solaire)", border: "var(--badge-genre-or-border)" },
  { bg: "var(--badge-genre-violet-bg)", text: "var(--color-accent-violet)", border: "var(--badge-genre-violet-border)" },
  { bg: "var(--badge-genre-info-bg)", text: "var(--color-info)", border: "var(--badge-genre-info-border)" },
  { bg: "var(--badge-genre-orange-bg)", text: "var(--color-accent-orange)", border: "var(--badge-genre-orange-border)" },
  { bg: "var(--badge-genre-rose-bg)", text: "var(--color-accent-rose)", border: "var(--badge-genre-rose-border)" },
] as const;

export const NOTIFICATION_TYPE_STYLES: Record<
  "stream_milestone" | "royalty_paid" | "verification_updated" | "rights_claim_updated" | "system",
  { bg: string; text: string }
> = {
  stream_milestone: { bg: OVERLAY.bleuSoft, text: "var(--color-accent-bleu-clair)" },
  royalty_paid: { bg: OVERLAY.orSoft, text: "var(--color-or-solaire)" },
  verification_updated: { bg: OVERLAY.vertSoft, text: "var(--color-vert-energie)" },
  rights_claim_updated: { bg: OVERLAY.avertissementSoft, text: "var(--color-avertissement)" },
  system: { bg: OVERLAY.neutreSoft, text: "var(--color-texte-secondaire)" },
};

export const WORK_CLAIM_STATUS_BG: Record<string, string> = {
  accepted: OVERLAY.vertSoft,
  rejected: OVERLAY.erreurSoft,
  escalated: OVERLAY.orSoft,
  default: OVERLAY.texteSoft,
};

export const LIVE_CONTROL_STYLES = {
  warnBanner: {
    backgroundColor: "var(--live-warn-bg)",
    border: "1px solid var(--live-warn-border)",
    color: "var(--color-or-solaire)",
  },
  okShell: {
    backgroundColor: "var(--live-ok-bg)",
    border: "1px solid var(--live-ok-border)",
  },
  errShell: {
    backgroundColor: "var(--live-err-bg)",
    border: "1px solid var(--live-err-border)",
  },
  warnSection: {
    backgroundColor: "var(--live-warn-section-bg)",
    border: "1px solid var(--live-warn-section-border)",
  },
  warnPill: { backgroundColor: "var(--live-warn-pill)" },
} as const;

export const HOMEPAGE_SECTION_STYLES = {
  trendingIcon: {
    background: "var(--gradient-vert-section)",
    border: `1px solid ${OVERLAY.vertBorder}`,
  },
  trendingPill: {
    background: "var(--badge-pill-vert-bg)",
    color: "var(--color-vert-energie)",
    border: "1px solid var(--badge-pill-vert-border)",
  },
  forYouIcon: {
    background: "var(--section-icon-or-bg)",
    border: "1px solid var(--section-icon-or-border)",
  },
  discoverIcon: {
    background: "var(--section-icon-violet-bg)",
    border: "1px solid var(--section-icon-violet-border)",
  },
  pourToiIcon: {
    background: "var(--section-icon-info-bg)",
    border: "1px solid var(--section-icon-info-border)",
  },
  pourToiPill: {
    background: "var(--badge-genre-info-bg)",
    color: "var(--color-info)",
    border: "1px solid var(--badge-genre-info-border)",
  },
  genresIcon: {
    background: "var(--section-icon-rose-bg)",
    border: "1px solid var(--section-icon-rose-border)",
  },
  emptyIcon: {
    background: "var(--gradient-vert-empty)",
    border: "1px solid var(--badge-genre-vert-border)",
  },
  ctaGlow: { boxShadow: "var(--shadow-vert-glow)" },
  playCtaGlow: { boxShadow: "var(--shadow-vert-glow-strong)" },
} as const;

export const WITHDRAWAL_STATUS_STYLES: Record<WithdrawalStatus, { bg: string; text: string }> = {
  pending: { bg: OVERLAY.orSoft, text: "var(--color-or-solaire)" },
  approved: { bg: OVERLAY.bleuSoft, text: "var(--color-accent-bleu-clair)" },
  processing: { bg: OVERLAY.avertissementSoft, text: "var(--color-avertissement)" },
  completed: { bg: OVERLAY.vertSoft, text: "var(--color-vert-energie)" },
  failed: { bg: OVERLAY.erreurSoft, text: "var(--color-erreur)" },
  cancelled: { bg: OVERLAY.neutreSoft, text: "var(--color-texte-desactive)" },
};

export const RIGHTS_CLAIM_STATUS_STYLES: Record<RightsClaimStatus, { bg: string; text: string }> = {
  pending: { bg: OVERLAY.orSoft, text: "var(--color-or-solaire)" },
  accepted: { bg: OVERLAY.vertSoft, text: "var(--color-vert-energie)" },
  rejected: { bg: OVERLAY.erreurSoft, text: "var(--color-erreur)" },
  escalated: { bg: OVERLAY.violetSoft, text: "var(--color-accent-violet-clair)" },
};

export const RIGHTS_CLAIM_TYPE_STYLES: Record<RightsClaimType, { color: string; bg: string }> = {
  ownership: { color: "var(--color-info)", bg: OVERLAY.bleuSoft },
  infringement: { color: "var(--color-erreur)", bg: OVERLAY.erreurSoft },
  takedown: { color: "var(--color-or-solaire)", bg: OVERLAY.orSoft },
};

/** Ligne active listener (playlist, favoris, album). */
export const LISTENER_ACTIVE_ROW_STYLE = {
  backgroundColor: OVERLAY.vertRow,
  border: `1px solid ${OVERLAY.vertBorder}`,
} as const;

export const LISTENER_INACTIVE_ROW_STYLE = {
  backgroundColor: "transparent",
  border: "1px solid transparent",
} as const;

export const BEAT_HIGHLIGHT_STYLE = {
  boxShadow: "var(--shadow-or-highlight)",
} as const;

export const ARTIST_RING_COLORS = [
  {
    color: "var(--color-vert-energie)",
    bg: "var(--chip-vert-bg)",
    glow: "var(--chip-vert-glow)",
    ring: "var(--chip-vert-ring)",
    inner: "var(--chip-vert-inner)",
  },
  {
    color: "var(--color-or-solaire)",
    bg: "var(--chip-or-bg)",
    glow: "var(--chip-or-glow)",
    ring: "var(--chip-or-ring)",
    inner: "var(--chip-or-inner)",
  },
  {
    color: "var(--color-accent-violet)",
    bg: "var(--chip-violet-bg)",
    glow: "var(--chip-violet-glow)",
    ring: "var(--chip-violet-ring)",
    inner: "var(--chip-violet-inner)",
  },
  {
    color: "var(--color-info)",
    bg: "var(--chip-info-bg)",
    glow: "var(--chip-info-glow)",
    ring: "var(--chip-info-ring)",
    inner: "var(--chip-info-inner)",
  },
  {
    color: "var(--color-accent-orange)",
    bg: "var(--chip-orange-bg)",
    glow: "var(--chip-orange-glow)",
    ring: "var(--chip-orange-ring)",
    inner: "var(--chip-orange-inner)",
  },
  {
    color: "var(--color-accent-rose)",
    bg: "var(--chip-rose-bg)",
    glow: "var(--chip-rose-glow)",
    ring: "var(--chip-rose-ring)",
    inner: "var(--chip-rose-inner)",
  },
] as const;
