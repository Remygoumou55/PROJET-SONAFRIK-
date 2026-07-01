import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { AdminMetricsRepository } from "./admin.metrics.repository";
import type {
  AdminFraudIncident,
  AdminFraudIncidentsPage,
  AdminFraudStreamEvent,
  AdminFraudSupervisionStats,
} from "./types";

const SESSION_SELECT =
  "id, user_id, track_id, platform, started_at, completed_at, last_heartbeat_at, total_listened_seconds, total_duration_seconds, listen_percentage, fraud_flags, is_valid_listen, ip_address, user_agent";

type SessionRow = {
  id: string;
  user_id: string;
  track_id: string;
  platform: string;
  started_at: string;
  completed_at: string | null;
  last_heartbeat_at: string;
  total_listened_seconds: number;
  total_duration_seconds: number;
  listen_percentage: number;
  fraud_flags: string[];
  is_valid_listen: boolean;
  ip_address: string | null;
  user_agent: string | null;
};

export class AdminFraudRepository {
  constructor(
    private readonly client: SonafrikSupabaseClient,
    private readonly metrics: AdminMetricsRepository,
  ) {}

  async listFraudIncidentsPage(limit = 200, offset = 0): Promise<AdminFraudIncidentsPage> {
    const [{ totalFlagged }, dataRes] = await Promise.all([
      this.metrics.getFraudMetrics(),
      this.client
        .from("stream_sessions")
        .select(SESSION_SELECT)
        .filter("fraud_flags", "neq", "{}")
        .order("started_at", { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    if (dataRes.error) throw dataRes.error;

    const rows = (dataRes.data ?? []) as unknown as SessionRow[];
    const items = await this.enrichSessions(rows);

    return {
      items,
      total: totalFlagged,
      limit,
      offset,
    };
  }

  async getFraudSupervisionStats(): Promise<AdminFraudSupervisionStats> {
    return this.metrics.getFraudSupervisionStats();
  }

  async listSessionStreamEvents(sessionId: string, limit = 40): Promise<AdminFraudStreamEvent[]> {
    const { data, error } = await this.client
      .from("stream_events")
      .select("id, event_type, position_seconds, metadata, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      event_type: row.event_type as string,
      position_seconds: row.position_seconds as number,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      created_at: row.created_at as string,
    }));
  }

  private async enrichSessions(rows: SessionRow[]): Promise<AdminFraudIncident[]> {
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const trackIds = [...new Set(rows.map((r) => r.track_id))];

    const [profilesRes, tracksRes] = await Promise.all([
      this.client.from("profiles").select("id, full_name, country_code").in("id", userIds),
      this.client
        .from("tracks")
        .select("id, title, creator_id, albums(title)")
        .in("id", trackIds),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (tracksRes.error) throw tracksRes.error;

    type TrackRow = {
      id: string;
      title: string;
      creator_id: string;
      albums: { title: string } | null;
    };

    const profileMap = new Map(
      (profilesRes.data ?? []).map((p) => [
        p.id as string,
        { name: p.full_name as string | null, country: p.country_code as string | null },
      ]),
    );

    const trackMap = new Map(
      ((tracksRes.data ?? []) as unknown as TrackRow[]).map((t) => [
        t.id,
        {
          title: t.title,
          albumTitle: t.albums?.title ?? null,
          creatorId: t.creator_id,
        },
      ]),
    );

    const creatorIds = [
      ...new Set(
        ((tracksRes.data ?? []) as unknown as TrackRow[]).map((t) => t.creator_id).filter(Boolean),
      ),
    ];

    let artistMap = new Map<string, string>();
    if (creatorIds.length > 0) {
      const artistsRes = await this.client
        .from("artist_profiles")
        .select("creator_id, stage_name")
        .in("creator_id", creatorIds);
      if (artistsRes.error) throw artistsRes.error;
      artistMap = new Map(
        (artistsRes.data ?? []).map((a) => [a.creator_id as string, a.stage_name as string]),
      );
    }

    return rows.map((row) => {
      const profile = profileMap.get(row.user_id);
      const track = trackMap.get(row.track_id);
      const creatorId = track?.creatorId ?? null;
      return {
        id: row.id,
        user_id: row.user_id,
        track_id: row.track_id,
        platform: row.platform,
        started_at: row.started_at,
        completed_at: row.completed_at,
        last_heartbeat_at: row.last_heartbeat_at,
        total_listened_seconds: row.total_listened_seconds,
        total_duration_seconds: row.total_duration_seconds,
        listen_percentage: row.listen_percentage,
        fraud_flags: row.fraud_flags,
        is_valid_listen: row.is_valid_listen,
        ip_address: row.ip_address ? String(row.ip_address) : null,
        user_agent: row.user_agent,
        user_name: profile?.name ?? null,
        user_country: profile?.country ?? null,
        track_title: track?.title ?? null,
        album_title: track?.albumTitle ?? null,
        artist_name: creatorId ? (artistMap.get(creatorId) ?? null) : null,
        artist_creator_id: creatorId,
      };
    });
  }

  async listFraudReviewStates(
    adminUserId: string,
  ): Promise<
    Record<
      string,
      {
        treated: boolean;
        archived: boolean;
        hidden: boolean;
        notes: string[];
        updatedAt: string;
      }
    >
  > {
    const { data, error } = await this.client
      .from("admin_fraud_reviews")
      .select("incident_id, treated, archived, hidden, notes, updated_at")
      .eq("admin_user_id", adminUserId);
    if (error) throw error;

    const store: Record<
      string,
      { treated: boolean; archived: boolean; hidden: boolean; notes: string[]; updatedAt: string }
    > = {};

    for (const row of data ?? []) {
      const raw = row as {
        incident_id: string;
        treated: boolean;
        archived: boolean;
        hidden: boolean;
        notes: unknown;
        updated_at: string;
      };
      store[raw.incident_id] = {
        treated: raw.treated,
        archived: raw.archived,
        hidden: raw.hidden,
        notes: Array.isArray(raw.notes) ? (raw.notes as string[]) : [],
        updatedAt: raw.updated_at,
      };
    }
    return store;
  }

  async upsertFraudReviewState(
    adminUserId: string,
    incidentId: string,
    patch: Partial<{ treated: boolean; archived: boolean; hidden: boolean; notes: string[] }>,
  ): Promise<{
    treated: boolean;
    archived: boolean;
    hidden: boolean;
    notes: string[];
    updatedAt: string;
  }> {
    const existingRes = await this.client
      .from("admin_fraud_reviews")
      .select("treated, archived, hidden, notes")
      .eq("admin_user_id", adminUserId)
      .eq("incident_id", incidentId)
      .maybeSingle();

    if (existingRes.error) throw existingRes.error;

    const prev = existingRes.data as {
      treated: boolean;
      archived: boolean;
      hidden: boolean;
      notes: unknown;
    } | null;

    const nextNotes = patch.notes ?? (Array.isArray(prev?.notes) ? (prev!.notes as string[]) : []);
    const payload = {
      incident_id: incidentId,
      admin_user_id: adminUserId,
      treated: patch.treated ?? prev?.treated ?? false,
      archived: patch.archived ?? prev?.archived ?? false,
      hidden: patch.hidden ?? prev?.hidden ?? false,
      notes: nextNotes,
    };

    const { data, error } = await this.client
      .from("admin_fraud_reviews")
      .upsert(payload, { onConflict: "incident_id,admin_user_id" })
      .select("treated, archived, hidden, notes, updated_at")
      .single();

    if (error) throw error;
    const row = data as {
      treated: boolean;
      archived: boolean;
      hidden: boolean;
      notes: unknown;
      updated_at: string;
    };

    return {
      treated: row.treated,
      archived: row.archived,
      hidden: row.hidden,
      notes: Array.isArray(row.notes) ? (row.notes as string[]) : [],
      updatedAt: row.updated_at,
    };
  }

  async bulkUpsertFraudReviewStates(
    adminUserId: string,
    incidentIds: string[],
    patch: Partial<{ treated: boolean; archived: boolean; hidden: boolean }>,
  ): Promise<void> {
    for (const incidentId of incidentIds) {
      await this.upsertFraudReviewState(adminUserId, incidentId, patch);
    }
  }
}
