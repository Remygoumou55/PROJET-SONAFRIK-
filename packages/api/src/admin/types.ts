import type { RightsClaimStatus, RightsClaimType, RoyaltyCycle } from "@sonafrik/types";

export type PendingCatalogItem = {
  id: string;
  type: "album" | "track";
  title: string;
  creator_name: string | null;
  submitted_at: string | null;
  release_type?: string;
};

export type AdminRightsClaim = {
  id: string;
  work_id: string;
  work_title: string;
  claimant_id: string;
  claimant_name: string | null;
  claim_type: RightsClaimType;
  status: RightsClaimStatus;
  description: string;
  evidence_url: string | null;
  created_at: string;
};

export type AdminFraudSession = {
  id: string;
  user_id: string;
  track_id: string;
  platform: string;
  started_at: string;
  total_listened_seconds: number;
  total_duration_seconds: number;
  listen_percentage: number;
  fraud_flags: string[];
  is_valid_listen: boolean;
  ip_address: string | null;
};

export type AdminDashboardKpis = {
  totalUsers: number;
  premiumUsers: number;
  streamsToday: number;
  streamsTotal: number;
  pendingCatalog: number;
  pendingWithdrawals: number;
  fraudSessions: number;
  launchCurrent: number;
  launchTarget: number;
};

export type AdminHealthCheck = {
  label: string;
  ok: boolean;
  latencyMs?: number;
  detail?: string;
};

export type AdminNavBadges = {
  content: number;
  pendingRightsClaims: number;
  fraudSessions: number;
  withdrawals: number;
};

export type AdminAuditActivityItem = {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type AdminAlert = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

export type AdminCockpitKpis = {
  totalUsers: number;
  newUsersToday: number;
  premiumUsers: number;
  activeArtists: number;
  newArtistsThisWeek: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChange: string | null;
};

export type AdminCockpitAlerts = {
  pendingRightsClaims: number;
  pendingWithdrawals: number;
  pendingArtistVerif: number;
  pendingCatalog: number;
  fraudSessions: number;
};

export type AdminMonthlyRevenue = {
  monthKey: string;
  label: string;
  totalGnf: number;
};

export type AdminCockpitData = {
  kpis: AdminCockpitKpis;
  alerts: AdminCockpitAlerts;
  recentActivity: AdminAuditActivityItem[];
  monthlyRevenue: AdminMonthlyRevenue[];
};

export type AdminHealthSnapshot = {
  checks: AdminHealthCheck[];
  alerts: AdminAlert[];
};

export type LiveControlRecentTrack = {
  id: string;
  title: string;
  publication_status: string;
  created_at: string;
};

export type LiveControlRecentListen = {
  id: string;
  is_valid_listen: boolean;
  created_at: string;
};

export type LiveControlRecentCycle = {
  id: string;
  status: string;
  created_at: string;
};

export type LiveControlRecentLedger = {
  id: string;
  amount_gnf: number;
  entry_type: string;
  created_at: string;
};

export type LiveControlSnapshot = {
  totalUsers: number;
  publishedTracks: number;
  validListens: number;
  royaltyCycles: number;
  ledgerEntries: number;
  recentTracks: LiveControlRecentTrack[];
  recentListens: LiveControlRecentListen[];
  recentCycles: LiveControlRecentCycle[];
  recentLedger: LiveControlRecentLedger[];
};

export type AdminRevenueArtistRow = {
  userId: string;
  artistName: string;
  totalEarnedGnf: number;
  balanceGnf: number;
};

export type AdminRevenueDashboardData = {
  monthlyRevenue: AdminMonthlyRevenue[];
  thisMonthTotal: number;
  lastMonthTotal: number;
  revenueChange: string | null;
  revenueByType: Record<string, number>;
  topArtists: AdminRevenueArtistRow[];
  royaltyCycles: RoyaltyCycle[];
  lastCycle: RoyaltyCycle | null;
  alerts: {
    cycleOverdue: boolean;
    daysSinceLastCycle: number;
    negativeBalanceCount: number;
  };
};

export type AdminWithdrawalAlertRow = {
  id: string;
  amountGnf: number;
  artistLabel: string;
};

export type AdminWithdrawalsDashboardMeta = {
  currentFilter: string;
  page: number;
  limit: number;
  total: number;
  alerts: {
    largeWithdrawals: AdminWithdrawalAlertRow[];
    overdueCount: number;
    totalPendingAmount: number;
  };
};
