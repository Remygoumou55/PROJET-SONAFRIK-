/** Chemins publics des assets officiels SONAFRIK (source : LOGO/) */

export const BRAND_ASSETS = {
  /** Emblème vinyle SA — favicon, nav compact, app icon */
  emblem: "/brand/emblem-app-icon.jpg",
  /** Logo principal vertical — auth, onboarding, splash */
  logoPrimaryVertical: "/brand/logo-primary-vertical.jpg",
  /** Bannière hero — landing, Open Graph, partage social */
  bannerHero: "/brand/banner-hero.jpg",
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

/** Dimensions recommandées par usage (alignées charte & mockups) */
export const BRAND_SIZES = {
  emblem: { xs: 24, sm: 32, md: 48, lg: 72, xl: 120, hero: 160 },
  logoPrimary: { auth: 220, hero: 280 },
} as const;
