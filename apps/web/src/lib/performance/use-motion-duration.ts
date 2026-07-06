import {
  ANIMATED_NUMBER_DURATION_DEFAULT_MS,
  CDC_UI_ANIMATION_MAX_MS,
  COUNT_UP_DURATION_DEFAULT_MS,
} from "@sonafrik/shared/performance";
import { usePerformanceFlags } from "./performance-context";

export function useMotionDuration(
  defaultDurationMs: number,
): { durationMs: number; motionEnabled: boolean } {
  const { animationsCdcCompliant, africaMode } = usePerformanceFlags();

  if (africaMode) {
    return { durationMs: 0, motionEnabled: false };
  }

  if (animationsCdcCompliant) {
    return { durationMs: CDC_UI_ANIMATION_MAX_MS, motionEnabled: true };
  }

  return { durationMs: defaultDurationMs, motionEnabled: true };
}

export function useCountUpMotion(): { durationMs: number; enabled: boolean } {
  const { durationMs, motionEnabled } = useMotionDuration(COUNT_UP_DURATION_DEFAULT_MS);
  return { durationMs, enabled: motionEnabled };
}

export function useAnimatedNumberMotion(
  enabled: boolean,
): { durationMs: number; animate: boolean } {
  const { durationMs, motionEnabled } = useMotionDuration(ANIMATED_NUMBER_DURATION_DEFAULT_MS);
  return { durationMs, animate: enabled && motionEnabled };
}
