import { getStageName, type AdminRepoClient } from "./admin.shared";
import type { AdminFraudSession, AdminRightsClaim, PendingCatalogItem } from "./types";

export class AdminModerationRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async reviewCatalogItem(
    id: string,
    entityType: "album" | "track",
    action: "published" | "rejected",
    reason?: string,
  ): Promise<void> {
    if (entityType === "album") {
      const { error } = await this.client.rpc("review_album_publication", {
        p_album_id: id,
        p_status: action,
        ...(action === "rejected" && reason ? { p_rejection_reason: reason } : {}),
      });
      if (error) throw error;
      return;
    }

    const { error } = await this.client.rpc("review_track_publication", {
      p_track_id: id,
      p_status: action,
      ...(action === "rejected" && reason ? { p_rejection_reason: reason } : {}),
    });
    if (error) throw error;
  }

  async updateRightsClaim(
    id: string,
    status: AdminRightsClaim["status"],
    notes?: string,
  ): Promise<void> {
    const patch: {
      status: AdminRightsClaim["status"];
      reviewed_at: string;
      resolution_notes?: string;
    } = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (notes) patch.resolution_notes = notes;
    const { error } = await this.client.from("rights_claims").update(patch).eq("id", id);
    if (error) throw error;
  }

  async listPendingCatalogItems(limit = 200): Promise<PendingCatalogItem[]> {
    const [albumsRes, tracksRes] = await Promise.all([
      this.client
        .from("albums")
        .select("id, title, release_type, submitted_at, creator_id, artist_profiles(stage_name)")
        .eq("publication_status", "pending_review")
        .is("deleted_at", null)
        .order("submitted_at", { ascending: true })
        .limit(limit),
      this.client
        .from("tracks")
        .select("id, title, submitted_at, creator_id, artist_profiles(stage_name)")
        .eq("publication_status", "pending_review")
        .is("deleted_at", null)
        .order("submitted_at", { ascending: true })
        .limit(limit),
    ]);

    if (albumsRes.error) throw albumsRes.error;
    if (tracksRes.error) throw tracksRes.error;

    type AlbumRow = {
      id: string;
      title: string;
      release_type: string | null;
      submitted_at: string | null;
      artist_profiles: { stage_name: string } | { stage_name: string }[] | null;
    };
    type TrackRow = {
      id: string;
      title: string;
      submitted_at: string | null;
      artist_profiles: { stage_name: string } | { stage_name: string }[] | null;
    };

    const pendingAlbums = ((albumsRes.data ?? []) as unknown as AlbumRow[]).map((a) => ({
      id: a.id,
      type: "album" as const,
      title: a.title,
      creator_name: getStageName(a.artist_profiles),
      submitted_at: a.submitted_at,
      release_type: a.release_type ?? "album",
    }));

    const pendingTracks = ((tracksRes.data ?? []) as unknown as TrackRow[]).map((t) => ({
      id: t.id,
      type: "track" as const,
      title: t.title,
      creator_name: getStageName(t.artist_profiles),
      submitted_at: t.submitted_at,
    }));

    return [...pendingAlbums, ...pendingTracks].sort((a, b) => {
      if (!a.submitted_at) return 1;
      if (!b.submitted_at) return -1;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });
  }

  async listRightsClaims(limit = 100): Promise<AdminRightsClaim[]> {
    const { data, error } = await this.client
      .from("rights_claims")
      .select(
        "id, work_id, claimant_id, claim_type, status, description, evidence_url, created_at, works(title), profiles!claimant_id(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    type RawClaimRow = {
      id: string;
      work_id: string;
      claimant_id: string;
      claim_type: AdminRightsClaim["claim_type"];
      status: AdminRightsClaim["status"];
      description: string;
      evidence_url: string | null;
      created_at: string;
      works: { title: string } | null;
      profiles: { full_name: string | null } | null;
    };

    return ((data ?? []) as unknown as RawClaimRow[]).map((row) => ({
      id: row.id,
      work_id: row.work_id,
      work_title: row.works?.title ?? "—",
      claimant_id: row.claimant_id,
      claimant_name: row.profiles?.full_name ?? null,
      claim_type: row.claim_type,
      status: row.status,
      description: row.description,
      evidence_url: row.evidence_url,
      created_at: row.created_at,
    }));
  }

  async listFraudSessions(limit = 50): Promise<AdminFraudSession[]> {
    const { data, error } = await this.client
      .from("stream_sessions")
      .select(
        "id, user_id, track_id, platform, started_at, total_listened_seconds, total_duration_seconds, listen_percentage, fraud_flags, is_valid_listen, ip_address",
      )
      .filter("fraud_flags", "neq", "{}")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as AdminFraudSession[];
  }
}
