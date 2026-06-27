export type DayMode = "morning" | "afternoon" | "evening" | "night";

export interface ModeConfig {
  mode: DayMode;
  label: string;
  emoji: string;
  greeting: string;
  musicMood: string;
  headerAccent: string;
}
