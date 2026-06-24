import type { RightsClaimStatus, RightsClaimType } from "@sonafrik/types";

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

export type AdminAlert = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

export type AdminHealthSnapshot = {
  checks: AdminHealthCheck[];
  alerts: AdminAlert[];
};
