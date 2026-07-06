import type { PublicationStatus, Track } from "@sonafrik/types";

/** Phases du cycle de vie publication — structure Enterprise (MVP + futur). */
export type PublicationLifecyclePhase =
  | "created"
  | "draft"
  | "pending_review"
  | "validated"
  | "published"
  | "withdrawn"
  | "archived";

export interface PublicationLifecycleEvent {
  id: string;
  phase: PublicationLifecyclePhase;
  date: string;
  label: string;
  detail?: string;
  reached: boolean;
}

const PHASE_LABELS: Record<PublicationLifecyclePhase, string> = {
  created: "Publication créée",
  draft: "Brouillon en cours",
  pending_review: "En revue",
  validated: "Validée par SONAFRIK",
  published: "Publiée sur SONAFRIK",
  withdrawn: "Retirée du catalogue",
  archived: "Archivée",
};

/** Timeline métier ordonnée chronologiquement (ancien → récent). */
export function buildPublicationLifecycleTimeline(track: Track): PublicationLifecycleEvent[] {
  const events: PublicationLifecycleEvent[] = [
    {
      id: "created",
      phase: "created",
      date: track.created_at,
      label: PHASE_LABELS.created,
      reached: true,
    },
  ];

  const status = track.publication_status;

  if (status === "draft") {
    events.push({
      id: "draft",
      phase: "draft",
      date: track.updated_at,
      label: PHASE_LABELS.draft,
      reached: true,
    });
  }

  if (status === "pending_review" || status === "published" || status === "rejected") {
    events.push({
      id: "draft-done",
      phase: "draft",
      date: track.created_at,
      label: "Brouillon complété",
      reached: true,
    });
    events.push({
      id: "pending_review",
      phase: "pending_review",
      date: track.submitted_at ?? track.updated_at,
      label: PHASE_LABELS.pending_review,
      reached: true,
    });
  }

  if (status === "published" && track.published_at) {
    events.push({
      id: "validated",
      phase: "validated",
      date: track.submitted_at ?? track.published_at,
      label: PHASE_LABELS.validated,
      reached: true,
    });
    events.push({
      id: "published",
      phase: "published",
      date: track.published_at,
      label: PHASE_LABELS.published,
      reached: true,
    });
  }

  if (status === "rejected") {
    events.push({
      id: "rejected",
      phase: "pending_review",
      date: track.updated_at,
      label: "Publication rejetée",
      detail: track.rejection_reason ?? undefined,
      reached: true,
    });
  }

  if (status === "archived") {
    events.push({
      id: "archived",
      phase: "archived",
      date: track.updated_at,
      label: PHASE_LABELS.archived,
      reached: true,
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function formatPublicationDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTrackDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isPublicationEditable(status: PublicationStatus): boolean {
  return status === "draft" || status === "rejected";
}

/** Phase future — structure prête sans workflow actif. */
export function isPublicationWithdrawn(_track: Track): boolean {
  return false;
}
