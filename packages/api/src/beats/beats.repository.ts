import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Beat, BeatPurchase } from "@sonafrik/types";

export class BeatsRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async listPublished(params: { limit?: number; genre?: string }): Promise<Beat[]> {
    const { data, error } = await this.client
      .from("beats")
      .select("*")
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(params.limit ?? 60);
    if (error) throw error;
    const beats = (data ?? []) as unknown as Beat[];
    return params.genre ? beats.filter((b) => b.genre === params.genre) : beats;
  }

  async listByCreator(creatorId: string): Promise<Beat[]> {
    const { data, error } = await this.client
      .from("beats")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Beat[];
  }

  async create(params: {
    creatorId:    string;
    title:        string;
    slug:         string;
    priceGnf:     number;
    description?: string;
    bpm?:         number;
    key?:         string;
    genre?:       string;
    licenseType:  string;
  }): Promise<Beat> {
    const { data, error } = await this.client
      .from("beats")
      .insert({
        creator_id:         params.creatorId,
        title:              params.title,
        slug:               params.slug,
        price_gnf:          params.priceGnf,
        description:        params.description ?? null,
        bpm:                params.bpm ?? null,
        key:                params.key ?? null,
        genre:              params.genre ?? null,
        license_type:       params.licenseType,
        publication_status: "draft",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as Beat;
  }

  async publish(beatId: string, creatorId: string): Promise<void> {
    const { error } = await this.client
      .from("beats")
      .update({ publication_status: "published" })
      .eq("id", beatId)
      .eq("creator_id", creatorId);
    if (error) throw error;
  }

  async purchaseBeat(buyerId: string, beatId: string): Promise<string> {
    const { data, error } = await this.client.rpc("purchase_beat", {
      p_buyer_id: buyerId,
      p_beat_id:  beatId,
    });
    if (error) throw error;
    return data as string;
  }

  async getPurchasedBeatIds(buyerId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("beat_purchases")
      .select("beat_id")
      .eq("buyer_id", buyerId);
    if (error) throw error;
    return ((data ?? []) as unknown as BeatPurchase[]).map((p) => p.beat_id);
  }
}
