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

/** Incident enrichi pour le centre de supervision fraude (lecture seule + métadonnées jointes). */
export type AdminFraudIncident = AdminFraudSession & {
  user_name: string | null;
  user_country: string | null;
  track_title: string | null;
  album_title: string | null;
  artist_name: string | null;
  artist_creator_id: string | null;
  user_agent: string | null;
  completed_at: string | null;
  last_heartbeat_at: string | null;
};

export type AdminFraudIncidentsPage = {
  items: AdminFraudIncident[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminFraudStreamEvent = {
  id: string;
  event_type: string;
  position_seconds: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type AdminFraudSupervisionStats = {
  todayTotal: number;
  activeSessions: number;
  fraudDetectedToday: number;
  criticalIncidents: number;
  normalSessionsToday: number;
  suspendedAccountsHint: number;
  validListensToday: number;
  rejectedListensToday: number;
  /** SSOT — aligné sidebar / dashboard / liste fraude */
  totalFlagged: number;
};

/** Snapshot admin synchronisé (LDSE) — badges + métriques canoniques */
export type AdminLiveSnapshot = {
  navBadges: AdminNavBadges;
  fraudMetrics: AdminFraudMetrics;
  moderationMetrics: AdminModerationMetrics;
  userMetrics: AdminUserMetrics;
  fetchedAt: string;
};

export type AdminFraudMetrics = {
  totalFlagged: number;
  flaggedThisMonth: number;
  flaggedToday: number;
};

/** Comptages modération — SSOT catalog / droits / retraits / vérif artistes */
export type AdminModerationMetrics = {
  pendingAlbums: number;
  pendingTracks: number;
  pendingCatalog: number;
  pendingWithdrawals: number;
  pendingRightsClaims: number;
  pendingArtistVerifications: number;
};

/** Comptages utilisateurs / artistes — SSOT dashboard + cockpit */
export type AdminUserMetrics = {
  totalUsers: number;
  premiumUsers: number;
  newUsersToday: number;
  activeArtists: number;
  newArtistsThisWeek: number;
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

export type AdminAnalyticsHealthService = {
  latency: number;
  status: "ok" | "slow" | "down";
};

export type AdminAnalyticsRecentStream = {
  trackTitle: string;
  artistName: string;
  city: string;
  at: string;
};

export type AdminAnalyticsTopTrack = {
  id: string;
  title: string;
  artistName: string;
  streams: number;
};

export type AdminAnalyticsTopArtist = {
  id: string;
  stageName: string;
  genre: string;
  streams: number;
};

export type AdminAnalyticsDashboard = {
  activeListeners: number;
  tracksBeingPlayed: number;
  topCity: string;
  topTrack: string;
  recentStreams: AdminAnalyticsRecentStream[];
  topTracks: AdminAnalyticsTopTrack[];
  topArtists: AdminAnalyticsTopArtist[];
  health: {
    database: AdminAnalyticsHealthService;
    storage: AdminAnalyticsHealthService;
    payments: AdminAnalyticsHealthService;
    streaming: AdminAnalyticsHealthService;
  };
};

export type AdminAwardEdition = {
  id: string;
  year: number;
  status: string;
  votes_open_at: string | null;
  votes_close_at: string | null;
  votes_closed_at: string | null;
  ceremony_date: string | null;
  prizes_distributed_at: string | null;
  score_streams_weight: number;
  score_votes_weight: number;
};

export type AdminAwardCategory = {
  id: string;
  edition_id: string;
  name: string;
  prize_amount_gnf: number;
  sort_order: number;
};

export type AdminAwardFundEntry = {
  amount_gnf: number;
  direction: string;
  created_at: string;
  source: string | null;
};

export type AdminAwardNominee = {
  id: string;
  categoryId: string;
  categoryName: string;
  prizeAmountGnf: number;
  voteCount: number;
  scoreCalculated: number | null;
  rankPosition: number | null;
  creatorId: string;
  stageName: string;
  avatarPath: string | null;
};

export type AdminAwardsDashboard = {
  activeEdition: AdminAwardEdition | null;
  nomineesByCategory: Record<string, AdminAwardNominee[]>;
  totalNominees: number;
  fundBalance: number;
  fundHistory: AdminAwardFundEntry[];
  pastEditions: AdminAwardEdition[];
  categories: AdminAwardCategory[];
};

export type AdminBeatStoreRow = {
  id: string;
  title: string;
  bpm: number | null;
  keySignature: string | null;
  genre: string | null;
  priceGnf: number;
  publicationStatus: string;
  audioPreviewPath: string | null;
  coverPath: string | null;
  createdAt: string;
  creatorId: string;
  stageName: string;
  purchaseCount: number;
  revenueGnf: number;
  rejectionReason: string | null;
};

export type AdminBeatStoreDashboard = {
  beats: AdminBeatStoreRow[];
  total: number;
  page: number;
  limit: number;
  currentFilter: "pending" | "published" | "rejected";
  counts: {
    pending: number;
    published: number;
    rejected: number;
  };
  totalRevenue: number;
};
