/** Couleurs officielles SONAFRIK — Charte Graphique V5.0
 * vertEnergie/orSolaire conservés (±3°), aucune régression visuelle */

export const colors = {
  vertEnergie: "#00D26A",
  vertProfond: "#0E5E3A",
  orSolaire: "#FFC20E",
  orProfond: "#DAAF37",
  noirProfond: "#0D0D0D",
  surface: "#1A1A1A",
  card: "#1F1F1F",
  elevated: "#2A2A2A",
  bordure: "#333333",
  textePrincipal: "#FFFFFF",
  texteSecondaire: "#A0A0A0",
  texteDesactive: "#555555",
  error: "#FF4444",
  success: "#00D26A",
  warning: "#FFC20E",
} as const;

export type SonafrikColor = keyof typeof colors;

export const cssVarMap: Record<SonafrikColor, string> = {
  vertEnergie: "var(--color-vert-energie)",
  vertProfond: "var(--color-vert-profond)",
  orSolaire: "var(--color-or-solaire)",
  orProfond: "var(--color-or-profond)",
  noirProfond: "var(--color-noir-profond)",
  surface: "var(--color-surface)",
  card: "var(--color-card)",
  elevated: "var(--color-elevated)",
  bordure: "var(--color-bordure)",
  textePrincipal: "var(--color-texte-principal)",
  texteSecondaire: "var(--color-texte-secondaire)",
  texteDesactive: "var(--color-texte-desactive)",
  error: "var(--color-error, #FF4444)",
  success: "var(--color-success, #00D26A)",
  warning: "var(--color-warning, #FFC20E)",
};
