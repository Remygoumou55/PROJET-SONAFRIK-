/** SONAFRIK — Constantes globales et règles CDC */

export interface SonafrikBrand {
  name: "SONAFRIK";
  slogan: "NOTRE BIEN COMMUN";
  secondarySignature: "Écoute · Participe · Prospère";
}

export const SONAFRIK_BRAND: SonafrikBrand = {
  name: "SONAFRIK",
  slogan: "NOTRE BIEN COMMUN",
  secondarySignature: "Écoute · Participe · Prospère",
};

/** Real Listen V7.2 — CDC Règle : seuil écoute valide = 90% */
export const REAL_LISTEN_THRESHOLD_PERCENT = 90;

/** Intervalle heartbeat streaming (ms) */
export const STREAM_HEARTBEAT_INTERVAL_MS = 10_000;

/** CDC Règle #2 : 7 jours de grâce après expiration Premium */
export const PREMIUM_GRACE_PERIOD_DAYS = 7;

/** CDC Règle #3 : 65% des revenus reversés aux artistes */
export const REVENUE_POOL_PERCENT = 65;

/** CDC Règle #5 : commission pourboire = 5% invisible UI */
export const TIP_COMMISSION_PERCENT = 5;
