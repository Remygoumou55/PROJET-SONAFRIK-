"use client";

import { useEffect, useState } from "react";
import type { ModeConfig } from "./useDayMode.types";
import { getDayMode } from "./useDayMode.utils";

export type { DayMode, ModeConfig } from "./useDayMode.types";
export { getDayMode } from "./useDayMode.utils";

export function useDayMode(): ModeConfig {
  const [mode, setMode] = useState<ModeConfig>(() => getDayMode(new Date().getHours()));

  useEffect(() => {
    const interval = setInterval(() => {
      setMode(getDayMode(new Date().getHours()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return mode;
}
