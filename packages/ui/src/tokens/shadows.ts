/** Shadow system — optimisé dark theme */

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px 0 rgba(0, 0, 0, 0.45)",
  lg: "0 8px 24px 0 rgba(0, 0, 0, 0.5)",
  xl: "0 16px 48px 0 rgba(0, 0, 0, 0.55)",
  glowVert: "0 0 20px rgba(0, 210, 106, 0.25)",
  glowOr: "0 0 20px rgba(255, 194, 14, 0.25)",
} as const;

export const shadowClass = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  glowVert: "shadow-[0_0_20px_rgba(0,210,106,0.25)]",
  glowOr: "shadow-[0_0_20px_rgba(255,194,14,0.25)]",
} as const;
