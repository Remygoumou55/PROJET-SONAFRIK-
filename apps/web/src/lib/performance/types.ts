export interface PerformanceFlags {
  readonly searchCacheEnabled: boolean;
  readonly animationsCdcCompliant: boolean;
  readonly africaMode: boolean;
  readonly routePrefetchEnabled: boolean;
}

export const DEFAULT_PERFORMANCE_FLAGS: PerformanceFlags = {
  searchCacheEnabled: false,
  animationsCdcCompliant: false,
  africaMode: false,
  routePrefetchEnabled: true,
};
