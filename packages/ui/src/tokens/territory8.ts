export const territory8Colors = {
  pearlBlack: "#07060B",
  deepBlack: "#040309",
  midnight: "#0B0912",
  deepSurface: "#0F0C18",
  elevatedSurface: "#14101F",
  softSurface: "#191422",

  primaryLavender: "#C84BFF",
  primaryLavenderBright: "#D96BFF",
  primaryLavenderDeep: "#8B2BCB",
  primaryLavenderSoft: "#E7A8FF",
  primaryLavenderMuted: "#9C68B5",

  audioCyan: "#45E6FF",
  audioCyanBright: "#73EEFF",
  audioCyanDeep: "#159DB8",
  audioCyanSoft: "#A8F7FF",

  softRose: "#FF5CCF",
  roseBright: "#FF79DA",
  roseDeep: "#C7359F",
  roseSoft: "#FFB3E8",

  pearl: "#F7F3FF",
  pearlSoft: "#E8E1EF",
  pearlMuted: "#C9C0D0",
  silver: "#B8B2C2",
  silverDeep: "#817A89",

  success: "#55D98B",
  successDeep: "#248A52",
  warning: "#F4B95E",
  warningDeep: "#A96C16",
  error: "#FF5C78",
  errorDeep: "#A92843",
  info: "#6EA8FF",

  surface01: "#0B0912",
  surface02: "#0F0C18",
  surface03: "#14101F",
  surface04: "#191422",
  surfaceElevated: "#21192C",
} as const;

export type Territory8Color = keyof typeof territory8Colors;

export const territory8ColorCssVarMap: Record<Territory8Color, string> = {
  pearlBlack: "var(--t8-pearl-black)",
  deepBlack: "var(--t8-deep-black)",
  midnight: "var(--t8-midnight)",
  deepSurface: "var(--t8-deep-surface)",
  elevatedSurface: "var(--t8-elevated-surface)",
  softSurface: "var(--t8-soft-surface)",

  primaryLavender: "var(--t8-primary-lavender)",
  primaryLavenderBright: "var(--t8-primary-lavender-bright)",
  primaryLavenderDeep: "var(--t8-primary-lavender-deep)",
  primaryLavenderSoft: "var(--t8-primary-lavender-soft)",
  primaryLavenderMuted: "var(--t8-primary-lavender-muted)",

  audioCyan: "var(--t8-audio-cyan)",
  audioCyanBright: "var(--t8-audio-cyan-bright)",
  audioCyanDeep: "var(--t8-audio-cyan-deep)",
  audioCyanSoft: "var(--t8-audio-cyan-soft)",

  softRose: "var(--t8-soft-rose)",
  roseBright: "var(--t8-rose-bright)",
  roseDeep: "var(--t8-rose-deep)",
  roseSoft: "var(--t8-rose-soft)",

  pearl: "var(--t8-pearl)",
  pearlSoft: "var(--t8-pearl-soft)",
  pearlMuted: "var(--t8-pearl-muted)",
  silver: "var(--t8-silver)",
  silverDeep: "var(--t8-silver-deep)",

  success: "var(--t8-success)",
  successDeep: "var(--t8-success-deep)",
  warning: "var(--t8-warning)",
  warningDeep: "var(--t8-warning-deep)",
  error: "var(--t8-error)",
  errorDeep: "var(--t8-error-deep)",
  info: "var(--t8-info)",

  surface01: "var(--t8-surface-01)",
  surface02: "var(--t8-surface-02)",
  surface03: "var(--t8-surface-03)",
  surface04: "var(--t8-surface-04)",
  surfaceElevated: "var(--t8-surface-elevated)",
};

export const territory8Borders = {
  default: "rgba(255, 255, 255, 0.07)",
  hover: "rgba(200, 75, 255, 0.30)",
  active: "rgba(200, 75, 255, 0.55)",
  audio: "rgba(69, 230, 255, 0.45)",
  premium: "rgba(247, 243, 255, 0.20)",
} as const;

export const territory8Glow = {
  lavender: "rgba(200, 75, 255, 0.18)",
  cyan: "rgba(69, 230, 255, 0.16)",
  rose: "rgba(255, 92, 207, 0.14)",
} as const;

export const territory8Gradients = {
  primaryLight: "linear-gradient(135deg, #C84BFF, #8B2BCB)",
  audioLight: "linear-gradient(135deg, #45E6FF, #C84BFF)",
  emotionalLight: "linear-gradient(135deg, #FF5CCF, #C84BFF)",
  luminousSystem: "linear-gradient(135deg, #45E6FF, #C84BFF, #FF5CCF)",
  deepSystem: "linear-gradient(135deg, #191422, #07060B)",
} as const;
