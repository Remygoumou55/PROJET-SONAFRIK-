import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const prefetchedRoutes = new Set<string>();

/** Précharge une route une seule fois par session navigateur. */
export function prefetchRoute(router: AppRouterInstance, href: string): void {
  if (!href || prefetchedRoutes.has(href)) return;
  prefetchedRoutes.add(href);
  void router.prefetch(href);
}

export interface PrefetchRoutesOptions {
  /** Diffère le batch via requestIdleCallback quand disponible. */
  idle?: boolean;
  /** Timeout max avant exécution forcée (ms). */
  idleTimeoutMs?: number;
}

/** Précharge un lot de routes — idle par défaut pour ne pas bloquer l'interaction. */
export function prefetchRoutes(
  router: AppRouterInstance,
  hrefs: readonly string[],
  options: PrefetchRoutesOptions = {},
): void {
  const unique = [...new Set(hrefs.filter(Boolean))];
  if (unique.length === 0) return;

  const run = () => {
    for (const href of unique) {
      prefetchRoute(router, href);
    }
  };

  const idle = options.idle ?? true;
  const timeout = options.idleTimeoutMs ?? 2_000;

  if (idle && typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout });
    return;
  }

  run();
}

/** Réinitialise le cache prefetch (tests uniquement). */
export function resetPrefetchCacheForTests(): void {
  prefetchedRoutes.clear();
}
