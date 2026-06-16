import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Beat, BeatPurchase } from "@sonafrik/types";

export class BeatsRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async listPublished(params: { limit?: number; genre?: string }): Promise<Beat[]> {
    const { data, error } = await this.client
      .from("beats" as never)
      .select("*")
      .eq("publication_status" as never, "published")
      .is("deleted_at" as never, null)
      .order("created_at" as never, { ascending: false })
      .limit(params.limit ?? 60);
    if (error) throw error;
    const beats = (data ?? []) as unknown as Beat[];
    return params.genre ? beats.filter((b) => b.genre === params.genre) : beats;
  }

  async listByCreator(creatorId: string): Promise<Beat[]> {
    const { data, error } = await this.client
      .from("beats" as never)
      .select("*")
      .eq("creator_id" as never, creatorId)
      .is("deleted_at" as never, null)
      .order("created_at" as never, { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Beat[];
  }

  async create(params: {
    creatorId:   string;
    title:       string;
    slug:        string;
    priceGnf:    number;
    description?: string;
    bpm?:        number;
    key?:        string;
    genre?:      string;
    licenseType: string;
  }): Promise<Beat> {
    const { data, error } = await this.client
      .from("beats" as never)
      .insert({
        creator_id:        params.creatorId,
        title:             params.title,
        slug:              params.slug,
        price_gnf:         params.priceGnf,
        description:       params.description ?? null,
        bpm:               params.bpm ?? null,
        key:               params.key ?? null,
        genre:             params.genre ?? null,
        license_type:      params.licenseType,
        publication_status:"draft",
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as Beat;
  }

  async publish(beatId: string, creatorId: string): Promise<void> {
    const { error } = await this.client
      .from("beats" as never)
      .update({ publication_status: "published" } as never)
      .eq("id" as never, beatId)
      .eq("creator_id" as never, creatorId);
    if (error) throw error;
  }

  async purchaseBeat(buyerId: string, beatId: string): Promise<string> {
    const { data, error } = await this.client.rpc("purchase_beat" as never, {
      p_buyer_id: buyerId,
      p_beat_id:  beatId,
    } as never);
    if (error) throw error;
    return data as string;
  }

  async getPurchasedBeatIds(buyerId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("beat_purchases" as never)
      .select("beat_id")
      .eq("buyer_id" as never, buyerId);
    if (error) throw error;
    return ((data ?? []) as unknown as BeatPurchase[]).map((p) => p.beat_id);
  }
}
