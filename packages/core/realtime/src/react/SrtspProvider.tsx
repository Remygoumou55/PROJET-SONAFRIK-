import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getSynchronizationEngine,
  type SubscriptionFilter,
  type SrtspEvent,
  type SrtspEventListener,
  type SrtspMetrics,
  type SrtspMonitorSnapshot,
  type SrtspPublishInput,
  type SrtspTransportAdapter,
  type SynchronizationEngine,
} from "../index";

export interface SrtspContextValue {
  engine: SynchronizationEngine;
  connectionState: "online" | "offline" | "reconnecting";
  publish: <T extends Record<string, unknown>>(input: SrtspPublishInput<T>) => SrtspEvent<T>;
  subscribe: (filter: SubscriptionFilter, listener: SrtspEventListener) => () => void;
  getSnapshot: () => SrtspMonitorSnapshot;
  getMetrics: () => SrtspMetrics;
}

const SrtspContext = createContext<SrtspContextValue | null>(null);

function stableEventKey(eventName: string | string[]): string {
  return Array.isArray(eventName) ? [...eventName].sort().join("|") : eventName;
}

export interface SrtspProviderProps {
  children: ReactNode;
  engine?: SynchronizationEngine;
  /** Transport injecté — instancie un moteur dédié si `engine` absent. */
  transport?: SrtspTransportAdapter;
  /** Connecte le transport au montage (défaut: true si transport fourni). */
  connectTransport?: boolean;
  trackBrowserOnline?: boolean;
}

export function SrtspProvider({
  children,
  engine: engineProp,
  transport,
  connectTransport,
  trackBrowserOnline = true,
}: SrtspProviderProps) {
  const engineRef = useRef<SynchronizationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current =
      engineProp ??
      getSynchronizationEngine({
        transport,
        connectTransportOnInit: connectTransport ?? Boolean(transport),
      });
  }
  const engine = engineRef.current;
  const [connectionState, setConnectionState] = useState(engine.getConnectionState());

  useEffect(() => {
    if (!trackBrowserOnline || typeof window === "undefined") return;
    const sync = () => {
      const online = navigator.onLine;
      engine.setOnline(online);
      setConnectionState(engine.getConnectionState());
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [engine, trackBrowserOnline]);

  const publish = useCallback(
    <T extends Record<string, unknown>>(input: SrtspPublishInput<T>) => engine.publish(input),
    [engine],
  );

  const subscribe = useCallback(
    (filter: SubscriptionFilter, listener: SrtspEventListener) => engine.subscribe(filter, listener),
    [engine],
  );

  const getSnapshot = useCallback(() => engine.getSnapshot(), [engine]);
  const getMetrics = useCallback(() => engine.getMetrics(), [engine]);

  const value = useMemo<SrtspContextValue>(
    () => ({ engine, connectionState, publish, subscribe, getSnapshot, getMetrics }),
    [engine, connectionState, publish, subscribe, getSnapshot, getMetrics],
  );

  return <SrtspContext.Provider value={value}>{children}</SrtspContext.Provider>;
}

export function useSrtsp(): SrtspContextValue {
  const ctx = useContext(SrtspContext);
  if (!ctx) throw new Error("useSrtsp must be used within SrtspProvider");
  return ctx;
}

export function useSrtspOptional(): SrtspContextValue | null {
  return useContext(SrtspContext);
}

export function useRealtime(): SrtspContextValue {
  return useSrtsp();
}

export function useSynchronization(): SrtspContextValue {
  return useSrtsp();
}

export function useEventSubscription(
  eventName: string | string[],
  listener: SrtspEventListener,
  enabled = true,
): void {
  const { subscribe } = useSrtsp();
  const listenerRef = useRef(listener);
  listenerRef.current = listener;
  const eventKey = useMemo(() => stableEventKey(eventName), [eventName]);

  useEffect(() => {
    if (!enabled) return;
    const filter: SubscriptionFilter = {
      eventName: eventKey.includes("|") ? eventKey.split("|") : eventKey,
    };
    return subscribe(filter, (event) => listenerRef.current(event));
  }, [subscribe, eventKey, enabled]);
}

export function useLiveQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  invalidateOn: string | string[],
  options?: {
    enabled?: boolean;
    initialData?: T;
    /** Ne pas refetch au montage si initialData fourni (SSR). */
    skipInitialFetch?: boolean;
    /** Filtre consommateur — ex. creatorId Mes publications. */
    shouldInvalidate?: (event: SrtspEvent) => boolean;
  },
): { data: T | undefined; loading: boolean; error: Error | null; refresh: () => void } {
  const { subscribe } = useSrtsp();
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [loading, setLoading] = useState(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const shouldInvalidateRef = useRef(options?.shouldInvalidate);
  shouldInvalidateRef.current = options?.shouldInvalidate;
  const invalidateKey = useMemo(() => stableEventKey(invalidateOn), [invalidateOn]);

  const refresh = useCallback(() => {
    setLoading(true);
    void fetcherRef
      .current()
      .then((result) => {
        if (mounted.current) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted.current) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (options?.enabled === false) return;
    if (options?.skipInitialFetch && options.initialData !== undefined) {
      setLoading(false);
      return () => {
        mounted.current = false;
      };
    }
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [key, refresh, options?.enabled, options?.skipInitialFetch, options?.initialData]);

  useEffect(() => {
    if (options?.enabled === false) return;
    const names = invalidateKey.includes("|") ? invalidateKey.split("|") : invalidateKey;
    return subscribe({ eventName: names }, (event) => {
      if (shouldInvalidateRef.current && !shouldInvalidateRef.current(event)) return;
      refresh();
    });
  }, [subscribe, invalidateKey, refresh, options?.enabled]);

  return { data, loading, error, refresh };
}

export { SrtspContext };
