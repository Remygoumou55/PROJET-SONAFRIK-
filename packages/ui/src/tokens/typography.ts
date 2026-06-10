/** Typographie Montserrat — CDC V9.0 */

export const typography = {
  fontFamily: "Montserrat, system-ui, sans-serif",
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  fontSize: {
    xs: { size: "0.75rem", lineHeight: "1rem" },
    sm: { size: "0.875rem", lineHeight: "1.25rem" },
    base: { size: "1rem", lineHeight: "1.5rem" },
    lg: { size: "1.125rem", lineHeight: "1.75rem" },
    xl: { size: "1.25rem", lineHeight: "1.75rem" },
    "2xl": { size: "1.5rem", lineHeight: "2rem" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
  },
} as const;

export const textStyles = {
  display: "text-4xl font-extrabold tracking-tight text-texte-principal",
  h1: "text-3xl font-bold text-texte-principal",
  h2: "text-2xl font-semibold text-texte-principal",
  h3: "text-xl font-semibold text-texte-principal",
  body: "text-base font-normal text-texte-principal",
  bodySmall: "text-sm font-normal text-texte-secondaire",
  caption: "text-xs font-medium text-texte-secondaire",
  label: "text-sm font-medium text-texte-principal",
} as const;
