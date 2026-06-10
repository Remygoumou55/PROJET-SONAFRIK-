export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./borderRadius";
export * from "./shadows";
export * from "./motion";

import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { borderRadius } from "./borderRadius";
import { shadows } from "./shadows";
import { motion, breakpoints } from "./motion";

/** Tokens design system SONAFRIK — export unifié */
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  motion,
  breakpoints,
} as const;

export type SonafrikTokens = typeof tokens;
