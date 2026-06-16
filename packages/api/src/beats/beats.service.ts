import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Beat } from "@sonafrik/types";
import { BeatsError } from "./errors";
import { BeatsRepository } from "./beats.repository";
import { createBeatSchema } from "./schemas";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export class BeatsService {
  private readonly repository: BeatsRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new BeatsRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new BeatsError("unauthorized");
    return user.id;
  }

  async listBeats(params?: { genre?: string; limit?: number }): Promise<Beat[]> {
    return this.repository.listPublished(params ?? {}).catch(() => {
      throw new BeatsError("list_failed");
    });
  }

  async listMyBeats(): Promise<Beat[]> {
    const userId = await this.requireUserId();
    return this.repository.listByCreator(userId).catch(() => {
      throw new BeatsError("list_failed");
    });
  }

  async createBeat(params: {
    title:       string;
    priceGnf:    number;
    description?: string;
    bpm?:        number;
    key?:        string;
    genre?:      string;
    licenseType?: string;
  }): Promise<Beat> {
    const parsed = createBeatSchema.safeParse({
      ...params,
      licenseType: params.licenseType ?? "non_exclusive",
    });
    if (!parsed.success) throw new BeatsError("create_failed");

    const userId = await this.requireUserId();
    const beat = await this.repository
      .create({
        creatorId:   userId,
        title:       parsed.data.title,
        slug:        slugify(parsed.data.title),
        priceGnf:    parsed.data.priceGnf,
        description: parsed.data.description,
        bpm:         parsed.data.bpm,
        key:         parsed.data.key,
        genre:       parsed.data.genre,
        licenseType: parsed.data.licenseType,
      })
      .catch(() => { throw new BeatsError("create_failed"); });
    return beat;
  }

  async purchaseBeat(beatId: string): Promise<string> {
    const userId = await this.requireUserId();
    const purchaseId = await this.repository
      .purchaseBeat(userId, beatId)
      .catch((err: Error) => {
        if (err.message?.includes("insufficient_balance")) throw new BeatsError("insufficient_balance");
        if (err.message?.includes("already_purchased"))   throw new BeatsError("already_purchased");
        if (err.message?.includes("beat_not_found"))      throw new BeatsError("beat_not_found");
        throw new BeatsError("purchase_failed");
      });
    return purchaseId;
  }

  async getPurchasedBeatIds(): Promise<string[]> {
    const userId = await this.requireUserId();
    return this.repository.getPurchasedBeatIds(userId).catch(() => []);
  }
}

export function createBeatsService(client: SonafrikSupabaseClient): BeatsService {
  return new BeatsService(client);
}
