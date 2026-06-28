import { isValidContentName } from "@/lib/content-filter";
import type { AdminAuditActivityItem } from "@sonafrik/api/admin";

const SYSTEM_EVENT_PREFIXES = [
  "identity.",
  "gotrue",
  "auth.",
  "system.",
  "supabase.",
  "postgres.",
] as const;

function isSystemAuditAction(action: string): boolean {
  const normalized = action.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.includes("read all")) return true;
  if (normalized.includes("notifications.read")) return true;
  return SYSTEM_EVENT_PREFIXES.some(
    (prefix) => normalized.startsWith(prefix) || normalized.includes(`${prefix}`),
  );
}

function hasTestMetadata(metadata: Record<string, unknown> | null): boolean {
  if (!metadata) return false;
  const trackTitle =
    typeof metadata.track_title === "string"
      ? metadata.track_title
      : typeof metadata.title === "string"
        ? metadata.title
        : null;
  const artistName =
    typeof metadata.artist_name === "string"
      ? metadata.artist_name
      : typeof metadata.stage_name === "string"
        ? metadata.stage_name
        : null;

  if (trackTitle && !isValidContentName(trackTitle)) return true;
  if (artistName && !isValidContentName(artistName)) return true;
  return false;
}

/** Filtre événements système Supabase et contenus seed/test du journal admin. */
export function filterAuditActivity(items: AdminAuditActivityItem[]): AdminAuditActivityItem[] {
  return items.filter((event) => {
    const action = event.action ?? "";
    if (isSystemAuditAction(action)) return false;
    if (hasTestMetadata(event.metadata)) return false;
    return true;
  });
}
