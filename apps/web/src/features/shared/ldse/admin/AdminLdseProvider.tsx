"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminLiveSnapshot, AdminNavBadges, AdminFraudMetrics } from "@sonafrik/api/admin";
import { refreshAdminLiveSnapshotAction } from "@/features/admin/actions/admin-ldse.actions";
import { ldseCache } from "@/features/shared/ldse/cache";
import { ldseEventBus } from "@/features/shared/ldse/event-bus";
import { registerLdseInvalidationRule } from "@/features/shared/ldse/invalidate-map";
import {
  ADMIN_LDSE_EVENTS,
  ADMIN_LDSE_KEYS,
} from "@/features/shared/ldse/admin/admin-ldse-config";
import { useLdseBackgroundRefresh, useLdseEvent } from "@/features/shared/ldse/LdseProvider";

const EMPTY_BADGES: AdminNavBadges = {
  content: 0,
  pendingRightsClaims: 0,
  fraudSessions: 0,
  withdrawals: 0,
};

const EMPTY_FRAUD: AdminFraudMetrics = {
  totalFlagged: 0,
  flaggedThisMonth: 0,
  flaggedToday: 0,
};

type AdminLdseContextValue = {
  snapshot: AdminLiveSnapshot;
  navBadges: AdminNavBadges;
  fraudMetrics: AdminFraudMetrics;
  refreshSnapshot: () => Promise<void>;
  isRefreshing: boolean;
};

const AdminLdseContext = createContext<AdminLdseContextValue | null>(null);

let invalidationRulesRegistered = false;

function ensureInvalidationRules(): void {
  if (invalidationRulesRegistered) return;
  invalidationRulesRegistered = true;
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.snapshotInvalidate,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.navBadges, ADMIN_LDSE_KEYS.fraudMetrics],
  });
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.fraudUpdated,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.fraudMetrics],
  });
}

interface Props {
  initialSnapshot: AdminLiveSnapshot;
  children: ReactNode;
}

export function AdminLdseProvider({ initialSnapshot, children }: Props) {
  ensureInvalidationRules();

  const [snapshot, setSnapshot] = useState<AdminLiveSnapshot>(() => {
    ldseCache.set(ADMIN_LDSE_KEYS.liveSnapshot, initialSnapshot, 60_000);
    ldseCache.set(ADMIN_LDSE_KEYS.navBadges, initialSnapshot.navBadges, 60_000);
    ldseCache.set(ADMIN_LDSE_KEYS.fraudMetrics, initialSnapshot.fraudMetrics, 60_000);
    return initialSnapshot;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await refreshAdminLiveSnapshotAction();
      ldseCache.set(ADMIN_LDSE_KEYS.liveSnapshot, next, 60_000);
      ldseCache.set(ADMIN_LDSE_KEYS.navBadges, next.navBadges, 60_000);
      ldseCache.set(ADMIN_LDSE_KEYS.fraudMetrics, next.fraudMetrics, 60_000);
      setSnapshot(next);
      ldseEventBus.publish(ADMIN_LDSE_EVENTS.snapshotRefreshed, { fetchedAt: next.fetchedAt });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useLdseEvent(ADMIN_LDSE_EVENTS.snapshotInvalidate, () => {
    void refreshSnapshot();
  });

  useLdseBackgroundRefresh(refreshSnapshot);

  const value = useMemo<AdminLdseContextValue>(
    () => ({
      snapshot,
      navBadges: snapshot.navBadges ?? EMPTY_BADGES,
      fraudMetrics: snapshot.fraudMetrics ?? EMPTY_FRAUD,
      refreshSnapshot,
      isRefreshing,
    }),
    [snapshot, refreshSnapshot, isRefreshing],
  );

  return <AdminLdseContext.Provider value={value}>{children}</AdminLdseContext.Provider>;
}

export function useAdminLdse(): AdminLdseContextValue {
  const ctx = useContext(AdminLdseContext);
  if (!ctx) {
    throw new Error("useAdminLdse must be used within AdminLdseProvider");
  }
  return ctx;
}

/** Badges sidebar — fallback props RSC si hors provider */
export function useAdminNavBadges(fallback?: AdminNavBadges): AdminNavBadges {
  const ctx = useContext(AdminLdseContext);
  if (ctx) return ctx.navBadges;
  return fallback ?? EMPTY_BADGES;
}

export function useAdminFraudMetrics(fallback?: AdminFraudMetrics): AdminFraudMetrics {
  const ctx = useContext(AdminLdseContext);
  if (ctx) return ctx.fraudMetrics;
  return fallback ?? EMPTY_FRAUD;
}

/** Publie un événement admin après une action optimiste locale */
export function publishAdminLdseEvent(
  type: (typeof ADMIN_LDSE_EVENTS)[keyof typeof ADMIN_LDSE_EVENTS],
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, payload);
  ldseEventBus.publish(ADMIN_LDSE_EVENTS.snapshotInvalidate, payload);
}
