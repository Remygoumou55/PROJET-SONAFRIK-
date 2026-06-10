/** Spacing system — base 4px */

export const spacing = {
  0: 0,
  px: 1,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  xxl: 48,
  "3xl": 64,
} as const;

export const spacingClass = {
  xs: "p-1",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
} as const;
