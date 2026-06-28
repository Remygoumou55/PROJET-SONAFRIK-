/** Clé de cache LDSE — namespace/domaine/ressource */
export type LdseCacheKey = string;

export type LdseEventPayload = Record<string, unknown> | undefined;

/** Événement métier publié sur le bus LDSE */
export type LdseEvent = {
  type: string;
  payload?: LdseEventPayload;
  at: number;
};

export type LdseCacheEntry<T> = {
  data: T;
  fetchedAt: number;
  staleAt: number;
  hits: number;
};

export type LdseCacheStats = {
  size: number;
  hits: number;
  misses: number;
  invalidations: number;
};

export type LdseBusStats = {
  subscriptions: number;
  eventsPublished: number;
  eventsByType: Record<string, number>;
};

export type LdseObservabilitySnapshot = {
  cache: LdseCacheStats;
  bus: LdseBusStats;
  activeRealtimeChannels: number;
};

export type LdseInvalidatePattern = string | RegExp;

export type LdseOptimisticPatch<T> = {
  key: LdseCacheKey;
  apply: (current: T | undefined) => T;
  rollback?: (previous: T | undefined) => void;
};
