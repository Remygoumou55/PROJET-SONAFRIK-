"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAdminHubInvalidateEvents, shouldRefreshAdminSnapshot } from "@sonafrik/realtime/adapters";
import { useEventSubscription } from "@sonafrik/realtime/react";
import type { AdminLiveSnapshot, AdminNavBadges, AdminFraudMetrics, AdminModerationMetrics, AdminUserMetrics } from "@sonafrik/api/admin";
import {
  fetchAdminLiveSnapshot,
} from "@/features/shared/ldse/admin/admin-ldse-fetch";
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

const EMPTY_MODERATION: AdminModerationMetrics = {
  pendingAlbums: 0,
  pendingTracks: 0,
  pendingCatalog: 0,
  pendingWithdrawals: 0,
  pendingRightsClaims: 0,
  pendingArtistVerifications: 0,
};

const EMPTY_USER: AdminUserMetrics = {
  totalUsers: 0,
  premiumUsers: 0,
  newUsersToday: 0,
  activeArtists: 0,
  newArtistsThisWeek: 0,
};

type AdminLdseContextValue = {
  snapshot: AdminLiveSnapshot;
  navBadges: AdminNavBadges;
  fraudMetrics: AdminFraudMetrics;
  moderationMetrics: AdminModerationMetrics;
  userMetrics: AdminUserMetrics;
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
    keys: [
      ADMIN_LDSE_KEYS.liveSnapshot,
      ADMIN_LDSE_KEYS.navBadges,
      ADMIN_LDSE_KEYS.fraudMetrics,
      ADMIN_LDSE_KEYS.moderationMetrics,
      ADMIN_LDSE_KEYS.userMetrics,
    ],
  });
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.fraudUpdated,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.fraudMetrics],
  });
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.catalogUpdated,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.navBadges, ADMIN_LDSE_KEYS.moderationMetrics],
  });
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.withdrawalUpdated,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.navBadges, ADMIN_LDSE_KEYS.moderationMetrics],
  });
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.rightsUpdated,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.navBadges, ADMIN_LDSE_KEYS.moderationMetrics],
  });
  registerLdseInvalidationRule({
    event: ADMIN_LDSE_EVENTS.userUpdated,
    keys: [ADMIN_LDSE_KEYS.liveSnapshot, ADMIN_LDSE_KEYS.userMetrics],
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
    ldseCache.set(ADMIN_LDSE_KEYS.moderationMetrics, initialSnapshot.moderationMetrics, 60_000);
    ldseCache.set(ADMIN_LDSE_KEYS.userMetrics, initialSnapshot.userMetrics, 60_000);
    return initialSnapshot;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await fetchAdminLiveSnapshot();
      ldseCache.set(ADMIN_LDSE_KEYS.liveSnapshot, next, 60_000);
      ldseCache.set(ADMIN_LDSE_KEYS.navBadges, next.navBadges, 60_000);
      ldseCache.set(ADMIN_LDSE_KEYS.fraudMetrics, next.fraudMetrics, 60_000);
      ldseCache.set(ADMIN_LDSE_KEYS.moderationMetrics, next.moderationMetrics, 60_000);
      ldseCache.set(ADMIN_LDSE_KEYS.userMetrics, next.userMetrics, 60_000);
      setSnapshot(next);
      ldseEventBus.publish(ADMIN_LDSE_EVENTS.snapshotRefreshed, { fetchedAt: next.fetchedAt });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useLdseEvent(ADMIN_LDSE_EVENTS.snapshotInvalidate, () => {
    void refreshSnapshot();
  });

  const adminInvalidateEvents = useMemo(() => getAdminHubInvalidateEvents(), []);
  useEventSubscription(
    adminInvalidateEvents,
    (event) => {
      if (!shouldRefreshAdminSnapshot(event)) return;
      void refreshSnapshot();
    },
    true,
  );

  useLdseBackgroundRefresh(refreshSnapshot);

  useEffect(() => {
    if (initialSnapshot.fetchedAt) return;
    void refreshSnapshot();
  }, [initialSnapshot.fetchedAt, refreshSnapshot]);

  const value = useMemo<AdminLdseContextValue>(
    () => ({
      snapshot,
      navBadges: snapshot.navBadges ?? EMPTY_BADGES,
      fraudMetrics: snapshot.fraudMetrics ?? EMPTY_FRAUD,
      moderationMetrics: snapshot.moderationMetrics ?? EMPTY_MODERATION,
      userMetrics: snapshot.userMetrics ?? EMPTY_USER,
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

export function useAdminModerationMetrics(fallback?: AdminModerationMetrics): AdminModerationMetrics {
  const ctx = useContext(AdminLdseContext);
  if (ctx) return ctx.moderationMetrics;
  return fallback ?? EMPTY_MODERATION;
}

export function useAdminUserMetrics(fallback?: AdminUserMetrics): AdminUserMetrics {
  const ctx = useContext(AdminLdseContext);
  if (ctx) return ctx.userMetrics;
  return fallback ?? EMPTY_USER;
}

/** Publie un événement admin après une action optimiste locale */
export function publishAdminLdseEvent(
  type: (typeof ADMIN_LDSE_EVENTS)[keyof typeof ADMIN_LDSE_EVENTS],
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, payload);
  ldseEventBus.publish(ADMIN_LDSE_EVENTS.snapshotInvalidate, payload);
}
