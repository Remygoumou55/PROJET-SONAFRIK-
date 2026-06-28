import { useMemo } from "react";
import type { AdminFraudIncident } from "@sonafrik/api/admin";
import {
  buildIncidentHeadline,
  resolveIncidentSeverity,
  type FraudSeverity,
} from "./humanizeFraudIncident";
import { countryLabel, parseDeviceLabel } from "./fraudDisplayHelpers";
import type { FraudIncidentAdminState } from "./fraudIncidentStore";

export type FraudStatusFilter = "all" | "untreated" | "treated" | "critical";
export type FraudPeriodFilter = "all" | "today" | "week";
export type FraudCategoryFilter =
  | "all"
  | "artists"
  | "users"
  | "country"
  | "device"
  | "ip"
  | "fraud"
  | "streaming";

export interface FraudFilterState {
  query: string;
  status: FraudStatusFilter;
  period: FraudPeriodFilter;
  category: FraudCategoryFilter;
}

export const DEFAULT_FRAUD_FILTERS: FraudFilterState = {
  query: "",
  status: "all",
  period: "all",
  category: "all",
};

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return d >= weekAgo;
}

function isToday(iso: string): boolean {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function matchesQuery(incident: AdminFraudIncident, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const headline = buildIncidentHeadline(incident.fraud_flags, incident.is_valid_listen);
  const haystack = [
    incident.user_name,
    incident.artist_name,
    incident.track_title,
    incident.album_title,
    incident.ip_address,
    countryLabel(incident.user_country),
    parseDeviceLabel(incident.user_agent, incident.platform),
    incident.platform,
    incident.id,
    headline.title,
    headline.summary,
    ...incident.fraud_flags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function useFraudIncidentFilters(
  incidents: AdminFraudIncident[],
  filters: FraudFilterState,
  adminStates: Record<string, FraudIncidentAdminState>,
) {
  return useMemo(() => {
    return incidents.filter((incident) => {
      const state = adminStates[incident.id];
      if (state?.hidden) return false;

      if (!matchesQuery(incident, filters.query.trim())) return false;

      const severity = resolveIncidentSeverity(incident.fraud_flags);

      if (filters.status === "untreated" && state?.treated) return false;
      if (filters.status === "treated" && !state?.treated) return false;
      if (filters.status === "critical" && severity !== "critical") return false;

      if (filters.period === "today" && !isToday(incident.started_at)) return false;
      if (filters.period === "week" && !isThisWeek(incident.started_at)) return false;

      switch (filters.category) {
        case "artists":
          if (!incident.artist_name) return false;
          break;
        case "users":
          if (!incident.user_name) return false;
          break;
        case "country":
          if (!incident.user_country) return false;
          break;
        case "device":
          if (!incident.user_agent && incident.platform === "web") return false;
          break;
        case "ip":
          if (!incident.ip_address) return false;
          break;
        case "fraud":
          if (incident.fraud_flags.length === 0) return false;
          break;
        case "streaming":
          if (!incident.is_valid_listen) return false;
          break;
        default:
          break;
      }

      return true;
    });
  }, [incidents, filters, adminStates]);
}

export function severityOf(incident: AdminFraudIncident): FraudSeverity {
  return resolveIncidentSeverity(incident.fraud_flags);
}
