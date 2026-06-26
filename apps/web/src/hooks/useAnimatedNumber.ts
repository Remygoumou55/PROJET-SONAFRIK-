"use client";

import { useEffect, useState } from "react";
import { ANIMATED_NUMBER_DURATION_DEFAULT_MS } from "@sonafrik/shared/performance";
import { useAnimatedNumberMotion } from "@/lib/performance";

/** Compte progressivement vers la valeur cible (léger, sans lib externe). */
export function useAnimatedNumber(
  target: number,
  enabled: boolean,
  durationMs = ANIMATED_NUMBER_DURATION_DEFAULT_MS,
): number {
  const { durationMs: motionDuration, animate } = useAnimatedNumberMotion(enabled);
  const effectiveDuration = animate ? Math.min(durationMs, motionDuration) : 0;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!animate || effectiveDuration <= 0) {
      setValue(enabled ? target : 0);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / effectiveDuration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, animate, effectiveDuration]);

  return value;
}
