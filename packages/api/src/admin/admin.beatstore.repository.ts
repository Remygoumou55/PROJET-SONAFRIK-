import { countQuery, type AdminRepoClient } from "./admin.shared";
import { fetchStageNamesByCreatorIds } from "../common/stage-name.helpers";
import type { AdminBeatStoreDashboard, AdminBeatStoreRow } from "./types";

export type BeatStoreFilter = "pending" | "published" | "rejected";

const STATUS_MAP: Record<BeatStoreFilter, string> = {
  pending: "draft",
  published: "published",
  rejected: "archived",
};

export class AdminBeatStoreRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async getDashboard(params: {
    filter: BeatStoreFilter;
    page: number;
    limit: number;
  }): Promise<AdminBeatStoreDashboard> {
    const { filter, page, limit } = params;
    const status = STATUS_MAP[filter] ?? "draft";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const beatsQuery = this.client
      .from("beats")
      .select(
        `
        id,
        title,
        bpm,
        key,
        genre,
        price_gnf,
        publication_status,
        audio_preview_path,
        cover_path,
        created_at,
        creator_id,
        rejection_reason
      `,
        { count: "exact" },
      )
      .eq("publication_status", status)
      .is("deleted_at", null)
      .order(filter === "published" ? "created_at" : "created_at", {
        ascending: filter !== "published",
      })
      .range(from, to);

    const [
      beatsRes,
      pendingCount,
      publishedCount,
      rejectedCount,
      purchasesRes,
    ] = await Promise.all([
      beatsQuery,
      countQuery(
        this.client
          .from("beats")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "draft")
          .is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("beats")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "published")
          .is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("beats")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "archived")
          .is("deleted_at", null),
      ),
      this.client.from("beat_purchases").select("amount_gnf"),
    ]);

    if (beatsRes.error) throw beatsRes.error;
    if (purchasesRes.error) throw purchasesRes.error;

    const creatorIds = [...new Set((beatsRes.data ?? []).map((b) => b.creator_id as string))];
    const stageNames = await fetchStageNamesByCreatorIds(this.client, creatorIds);

    const beatIds = (beatsRes.data ?? []).map((b) => b.id as string);
    const purchaseStats = new Map<string, { count: number; revenue: number }>();
    if (beatIds.length > 0) {
      const { data: purchaseRows, error: purchaseError } = await this.client
        .from("beat_purchases")
        .select("beat_id, amount_gnf")
        .in("beat_id", beatIds);
      if (purchaseError) throw purchaseError;
      for (const row of purchaseRows ?? []) {
        const beatId = row.beat_id as string;
        const existing = purchaseStats.get(beatId) ?? { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(row.amount_gnf ?? 0);
        purchaseStats.set(beatId, existing);
      }
    }

    const totalRevenue = (purchasesRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount_gnf ?? 0),
      0,
    );

    const beats: AdminBeatStoreRow[] = (beatsRes.data ?? []).map((row) => {
      const stats = purchaseStats.get(row.id as string);
      return {
        id: row.id as string,
        title: row.title as string,
        bpm: row.bpm as number | null,
        keySignature: row.key as string | null,
        genre: row.genre as string | null,
        priceGnf: Number(row.price_gnf ?? 0),
        publicationStatus: row.publication_status as string,
        audioPreviewPath: row.audio_preview_path as string | null,
        coverPath: row.cover_path as string | null,
        createdAt: row.created_at as string,
        creatorId: row.creator_id as string,
        stageName: stageNames.get(row.creator_id as string) ?? "—",
        purchaseCount: stats?.count ?? 0,
        revenueGnf: stats?.revenue ?? 0,
        rejectionReason: row.rejection_reason as string | null,
      };
    });

    return {
      beats,
      total: beatsRes.count ?? 0,
      page,
      limit,
      currentFilter: filter,
      counts: {
        pending: pendingCount,
        published: publishedCount,
        rejected: rejectedCount,
      },
      totalRevenue,
    };
  }

  async approveBeat(beatId: string): Promise<void> {
    const { error } = await this.client.rpc("admin_approve_beat", { p_beat_id: beatId });
    if (error) throw error;
  }

  async rejectBeat(beatId: string, reason: string): Promise<void> {
    const { error } = await this.client.rpc("admin_reject_beat", {
      p_beat_id: beatId,
      p_reason: reason,
    });
    if (error) throw error;
  }

  async deleteBeat(beatId: string): Promise<void> {
    const { error } = await this.client.rpc("admin_delete_beat", { p_beat_id: beatId });
    if (error) throw error;
  }

  async createBeatPreviewSignedUrl(storagePath: string): Promise<string | null> {
    const { data, error } = await this.client.storage
      .from("catalog-audio")
      .createSignedUrl(storagePath, 300);
    if (error) throw error;
    return data?.signedUrl ?? null;
  }
}
