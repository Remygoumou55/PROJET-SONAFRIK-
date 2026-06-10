/** Motion — max 300ms fade/slide (CDC Règle design) */

export const motion = {
  durationMs: 300,
  durationFastMs: 150,
  easing: "ease-in-out",
  transition: "transition-all duration-300 ease-in-out",
  transitionFast: "transition-all duration-150 ease-in-out",
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
