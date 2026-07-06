import type { AdminLiveSnapshot } from "@sonafrik/api/admin";

/** Snapshot vide — layout admin délègue le chargement au client SRTSP/LDSE. */
export const EMPTY_ADMIN_LIVE_SNAPSHOT: AdminLiveSnapshot = {
  navBadges: {
    content: 0,
    pendingRightsClaims: 0,
    fraudSessions: 0,
    withdrawals: 0,
  },
  fraudMetrics: {
    totalFlagged: 0,
    flaggedThisMonth: 0,
    flaggedToday: 0,
  },
  moderationMetrics: {
    pendingAlbums: 0,
    pendingTracks: 0,
    pendingCatalog: 0,
    pendingWithdrawals: 0,
    pendingRightsClaims: 0,
    pendingArtistVerifications: 0,
  },
  userMetrics: {
    totalUsers: 0,
    premiumUsers: 0,
    newUsersToday: 0,
    activeArtists: 0,
    newArtistsThisWeek: 0,
  },
  fetchedAt: "",
};
