export type { PerformanceFlags } from "./types";
export { DEFAULT_PERFORMANCE_FLAGS } from "./types";
export { PerformanceProvider, usePerformanceFlags } from "./performance-context";
export {
  useMotionDuration,
  useCountUpMotion,
  useAnimatedNumberMotion,
} from "./use-motion-duration";
export {
  prefetchRoute,
  prefetchRoutes,
  useSmartPrefetch,
  resetPrefetchCacheForTests,
} from "./smart-prefetch";
export type { PrefetchRoutesOptions, UseSmartPrefetchOptions } from "./smart-prefetch";
