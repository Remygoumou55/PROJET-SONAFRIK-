import type {
  AdminAccountStatus,
  AdminArtistsFilter,
  AdminArtistsListResult,
  AdminArtistListItem,
  AdminCreatorTier,
  AdminUsersFilter,
  AdminUsersListResult,
  AdminUserListItem,
} from "@sonafrik/types";
import type { AdminRepoClient } from "./admin.shared";

const USERS_PAGE_SIZE = 50;

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country_code: string | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  account_status: AdminAccountStatus;
  warning_count: number;
  last_warning_at: string | null;
  suspended_until: string | null;
  suspended_reason: string | null;
  fraud_score: number;
  created_at: string;
};

type UserListStatsRow = {
  user_id: string;
  last_seen_at: string | null;
  session_count: number;
};

type CreatorCatalogStatsRow = {
  creator_id: string;
  tracks_count: number;
  valid_streams: number;
};

function isListenerProfile(accountType: string | null): boolean {
  return accountType !== "artiste";
}

export class AdminUsersRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async listUsers(params: {
    q?: string;
    filter?: AdminUsersFilter;
    page?: number;
  }): Promise<AdminUsersListResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = USERS_PAGE_SIZE;
    const offset = (page - 1) * limit;

    let query = this.client
      .from("profiles")
      .select(
        "id, full_name, phone, email, city, country_code, is_premium, premium_expires_at, account_status, warning_count, last_warning_at, suspended_until, suspended_reason, fraud_score, created_at, account_type",
        { count: "exact" },
      )
      .is("deleted_at", null)
      .or("account_type.is.null,account_type.neq.artiste")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.filter === "premium") {
      query = query.eq("is_premium", true);
    } else if (params.filter === "suspended") {
      query = query.eq("account_status", "suspended");
    } else if (params.filter === "new") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", sevenDaysAgo);
    }

    const q = params.q?.trim();
    if (q) {
      const safe = q.replace(/[%_,]/g, "");
      query = query.or(
        `full_name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    type RawRow = ProfileRow & { account_type: string | null };
    const rows = ((data ?? []) as unknown as RawRow[]).filter((row) =>
      isListenerProfile(row.account_type),
    );

    const userIds = rows.map((r) => r.id);
    const userStatsMap = await this.fetchUserListStatsMap(userIds);

    const users: AdminUserListItem[] = rows.map((row) => ({
      id: row.id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      city: row.city,
      country_code: row.country_code,
      is_premium: row.is_premium,
      premium_expires_at: row.premium_expires_at,
      account_status: row.account_status ?? "active",
      warning_count: row.warning_count ?? 0,
      last_warning_at: row.last_warning_at,
      suspended_until: row.suspended_until,
      suspended_reason: row.suspended_reason,
      fraud_score: row.fraud_score ?? 0,
      created_at: row.created_at,
      last_seen_at: userStatsMap.get(row.id)?.last_seen_at ?? null,
      stream_sessions_count: userStatsMap.get(row.id)?.session_count ?? 0,
    }));

    return { users, total: count ?? users.length, page, limit };
  }

  private async fetchUserListStatsMap(
    userIds: string[],
  ): Promise<Map<string, { last_seen_at: string | null; session_count: number }>> {
    const map = new Map<string, { last_seen_at: string | null; session_count: number }>();
    if (userIds.length === 0) return map;

    const { data, error } = await this.client.rpc("admin_batch_user_list_stats", {
      p_user_ids: userIds,
    });
    if (error) {
      // Fallback silencieux — stats secondaires, la liste reste affichée
      return map;
    }

    for (const row of (data ?? []) as UserListStatsRow[]) {
      map.set(row.user_id, {
        last_seen_at: row.last_seen_at,
        session_count: Number(row.session_count ?? 0),
      });
    }
    return map;
  }

  async warnUser(userId: string, reason: string, adminNote: string): Promise<void> {
    const { error } = await this.client.rpc("admin_warn_user", {
      p_user_id: userId,
      p_reason: reason,
      p_admin_note: adminNote,
    });
    if (error) throw error;
  }

  async suspendUser(userId: string, durationDays: number, reason: string): Promise<void> {
    const { error } = await this.client.rpc("admin_suspend_user", {
      p_user_id: userId,
      p_duration_days: durationDays,
      p_reason: reason,
    });
    if (error) throw error;
  }

  async deleteUser(userId: string, reason: string): Promise<void> {
    const { error } = await this.client.rpc("admin_delete_user", {
      p_user_id: userId,
      p_reason: reason,
    });
    if (error) throw error;
  }

  async resolveProfileDisplayLabels(profileIds: string[]): Promise<Record<string, string>> {
    if (profileIds.length === 0) return {};
    const { data, error } = await this.client
      .from("profiles")
      .select("id, full_name, email")
      .in("id", profileIds);
    if (error) throw error;

    const labels: Record<string, string> = {};
    for (const row of data ?? []) {
      const name =
        (row.full_name as string | null)?.trim() ||
        (row.email as string | null)?.split("@")[0] ||
        "Administrateur";
      labels[row.id as string] = name;
    }
    return labels;
  }
}

export class AdminArtistsRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async listArtists(params: {
    q?: string;
    filter?: AdminArtistsFilter;
    page?: number;
  }): Promise<AdminArtistsListResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = USERS_PAGE_SIZE;
    const offset = (page - 1) * limit;

    let pendingCreatorIds: string[] | null = null;
    if (params.filter === "pending") {
      const { data: pendingRows, error: pendingError } = await this.client
        .from("creator_verifications")
        .select("creator_id")
        .in("status", ["pending", "draft"]);
      if (pendingError) throw pendingError;
      pendingCreatorIds = [...new Set((pendingRows ?? []).map((r) => r.creator_id as string))];
      if (pendingCreatorIds.length === 0) {
        return { artists: [], total: 0, page, limit };
      }
    }

    let query = this.client
      .from("artist_profiles")
      .select(
        `
        creator_id,
        stage_name,
        genres,
        profile_photo,
        verified,
        verified_at,
        created_at,
        creators!inner (
          id,
          owner_id,
          status,
          tier,
          created_at,
          profiles!creators_owner_id_fkey (
            full_name,
            phone,
            email,
            city,
            avatar_url,
            account_status,
            fraud_score
          )
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.filter === "verified") {
      query = query.eq("verified", true);
    } else if (params.filter === "tier_etabli") {
      query = query.eq("creators.tier", "etabli");
    } else if (params.filter === "suspended") {
      query = query.eq("creators.status", "suspended");
    } else if (params.filter === "pending" && pendingCreatorIds) {
      query = query.in("creator_id", pendingCreatorIds).eq("verified", false);
    }

    const q = params.q?.trim();
    if (q) {
      const safe = q.replace(/[%_,]/g, "");
      query = query.ilike("stage_name", `%${safe}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    type RawArtist = {
      creator_id: string;
      stage_name: string;
      genres: string[];
      profile_photo: string | null;
      verified: boolean;
      created_at: string;
      creators: {
        id: string;
        owner_id: string;
        status: string;
        tier: string;
        created_at: string;
        profiles: {
          full_name: string | null;
          phone: string | null;
          email: string | null;
          city: string | null;
          avatar_url: string | null;
          account_status: AdminAccountStatus;
          fraud_score: number;
        } | null;
      };
    };

    const rawRows = (data ?? []) as unknown as RawArtist[];
    const creatorIds = rawRows.map((r) => r.creator_id);

    const [verifications, catalogStats] = await Promise.all([
      this.fetchVerificationMap(creatorIds),
      this.fetchCreatorCatalogStatsMap(creatorIds),
    ]);

    const artists: AdminArtistListItem[] = rawRows.map((row) => {
      const creator = row.creators;
      const profile = creator.profiles;
      const verification = verifications.get(row.creator_id);
      const tier = (creator.tier ?? "emergent") as AdminCreatorTier;
      const stats = catalogStats.get(row.creator_id);
      const totalStreams = stats?.valid_streams ?? 0;

      return {
        creator_id: row.creator_id,
        artist_profile_id: row.creator_id,
        stage_name: row.stage_name,
        genres: row.genres ?? [],
        profile_photo: row.profile_photo,
        avatar_url: profile?.avatar_url ?? null,
        city: profile?.city ?? null,
        tier,
        creator_status: creator.status,
        verified: row.verified,
        verification_status: verification?.status ?? (row.verified ? "approved" : "none"),
        pending_verification_id: verification?.pendingId ?? null,
        owner_id: creator.owner_id,
        owner_name: profile?.full_name ?? null,
        owner_phone: profile?.phone ?? null,
        owner_email: profile?.email ?? null,
        owner_account_status: profile?.account_status ?? "active",
        creator_score: Math.min(100, Math.round(totalStreams / 50)),
        total_streams: totalStreams,
        tracks_count: stats?.tracks_count ?? 0,
        albums_count: 0,
        created_at: creator.created_at,
      };
    });

    artists.sort((a, b) => b.total_streams - a.total_streams);

    return {
      artists,
      total: count ?? artists.length,
      page,
      limit,
    };
  }

  private async fetchVerificationMap(
    creatorIds: string[],
  ): Promise<Map<string, { status: AdminArtistListItem["verification_status"]; pendingId: string | null }>> {
    const map = new Map<string, { status: AdminArtistListItem["verification_status"]; pendingId: string | null }>();
    if (creatorIds.length === 0) return map;

    const { data, error } = await this.client
      .from("creator_verifications")
      .select("id, creator_id, status")
      .in("creator_id", creatorIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    type VerRow = { id: string; creator_id: string; status: string };
    for (const row of (data ?? []) as VerRow[]) {
      if (map.has(row.creator_id)) continue;
      const status = row.status as AdminArtistListItem["verification_status"];
      map.set(row.creator_id, {
        status,
        pendingId: row.status === "pending" ? row.id : null,
      });
    }
    return map;
  }

  private async fetchCreatorCatalogStatsMap(
    creatorIds: string[],
  ): Promise<Map<string, { tracks_count: number; valid_streams: number }>> {
    const map = new Map<string, { tracks_count: number; valid_streams: number }>();
    if (creatorIds.length === 0) return map;

    const { data, error } = await this.client.rpc("admin_batch_creator_catalog_stats", {
      p_creator_ids: creatorIds,
    });
    if (error) {
      return map;
    }

    for (const row of (data ?? []) as CreatorCatalogStatsRow[]) {
      map.set(row.creator_id, {
        tracks_count: Number(row.tracks_count ?? 0),
        valid_streams: Number(row.valid_streams ?? 0),
      });
    }
    return map;
  }

  async verifyArtist(creatorId: string, approved: boolean, note: string): Promise<void> {
    const { error } = await this.client.rpc("admin_verify_artist", {
      p_creator_id: creatorId,
      p_approved: approved,
      p_note: note,
    });
    if (error) throw error;
  }

  async changeArtistTier(creatorId: string, newTier: AdminCreatorTier): Promise<void> {
    const { error } = await this.client.rpc("admin_change_artist_tier", {
      p_creator_id: creatorId,
      p_new_tier: newTier,
    });
    if (error) throw error;
  }

  async suspendCreator(creatorId: string, reason: string): Promise<void> {
    const { error } = await this.client.rpc("admin_suspend_creator", {
      p_creator_id: creatorId,
      p_reason: reason,
    });
    if (error) throw error;
  }

  async warnCreatorOwner(ownerId: string, reason: string, note: string): Promise<void> {
    const { error } = await this.client.rpc("admin_warn_user", {
      p_user_id: ownerId,
      p_reason: reason,
      p_admin_note: note,
    });
    if (error) throw error;
  }
}
