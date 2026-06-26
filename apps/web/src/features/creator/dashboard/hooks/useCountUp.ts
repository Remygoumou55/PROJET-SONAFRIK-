"use client";

import { useEffect, useRef, useState } from "react";
import { COUNT_UP_DURATION_DEFAULT_MS } from "@sonafrik/shared/performance";
import { useCountUpMotion } from "@/lib/performance";

export function useCountUp(target: number, duration = COUNT_UP_DURATION_DEFAULT_MS, enabled = true): number {
  const { durationMs: motionDuration, enabled: motionEnabled } = useCountUpMotion();
  const effectiveDuration = motionEnabled ? Math.min(duration, motionDuration) : 0;
  const effectiveEnabled = enabled && motionEnabled;
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!effectiveEnabled || target <= 0) {
      setValue(target);
      return;
    }
    if (started.current) {
      setValue(target);
      return;
    }
    started.current = true;

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / effectiveDuration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, effectiveDuration, effectiveEnabled]);

  return value;
}
