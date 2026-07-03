import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Album, CatalogContext, Genre, Track, TrackAppearance, TrackCredit } from "@sonafrik/types";
import { CatalogError } from "./errors";
import { CatalogRepository } from "./catalog.repository";
import { PublicationIntegrationService } from "../publication/integration";
import {
  catalogAssetUploadSchema,
  catalogAssetConfirmSchema,
  createAlbumSchema,
  createTrackSchema,
  setTrackCreditsSchema,
  updateAlbumSchema,
  updateTrackSchema,
  type CatalogAssetUploadInput,
  type CatalogAssetConfirmInput,
  type CreateAlbumInput,
  type CreateTrackInput,
  type SetTrackCreditsInput,
  type UpdateAlbumInput,
  type UpdateTrackInput,
} from "./schemas";

function isDevBypass(): boolean {
  return (
    (process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1") ||
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ||
    process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true"
  );
}

function toCatalogError(
  err: unknown,
  code: "track_create_failed" | "unknown" = "unknown",
): CatalogError {
  if (err instanceof CatalogError) return err;
  const rawMsg = err instanceof Error ? err.message : String(err);
  return new CatalogError(code, rawMsg);
}

export class CatalogService {
  private readonly repository: CatalogRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new CatalogRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (user) return user.id;

    if (isDevBypass()) return "dev-mock-id";
    throw new CatalogError("unauthorized");
  }

  private async requireCreatorId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (user) {
      const { data } = await this.client.rpc("is_artist_account", { p_user_id: user.id });
      if (!data) throw new CatalogError("not_artist_account");
      try {
        return await this.repository.ensureCreatorId();
      } catch {
        throw new CatalogError("creator_not_found");
      }
    }

    if (isDevBypass()) return "dev-creator-id";
    throw new CatalogError("unauthorized");
  }

  async getCatalogContext(): Promise<CatalogContext> {
    const creatorId = await this.requireCreatorId();
    const [albums, tracks] = await Promise.all([
      this.repository.listAlbums(creatorId),
      this.repository.listTracks(creatorId),
    ]);

    return {
      creatorId,
      albumsCount: albums.filter((a) => a.release_type === "album" || a.release_type === "ep").length,
      singlesCount: albums.filter((a) => a.release_type === "single").length,
      tracksCount: tracks.length,
      pendingReview:
        albums.filter((a) => a.publication_status === "pending_review").length +
        tracks.filter((t) => t.publication_status === "pending_review").length,
      publishedCount:
        albums.filter((a) => a.publication_status === "published").length +
        tracks.filter((t) => t.publication_status === "published").length,
    };
  }

  async getGenres(): Promise<Genre[]> {
    return this.repository.getGenres();
  }

  async listAlbums(): Promise<Album[]> {
    const creatorId = await this.requireCreatorId();
    return this.repository.listAlbums(creatorId);
  }

  async createAlbum(input: CreateAlbumInput): Promise<Album> {
    const parsed = createAlbumSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_album");

    const userId = await this.requireUserId();
    const creatorId = await this.requireCreatorId();
    const slug = this.repository.buildSlug(parsed.data.title, creatorId);

    let album: Album;
    try {
      album = await this.repository.createAlbum(creatorId, userId, {
      title: parsed.data.title,
      slug,
      release_type: parsed.data.releaseType,
      upc: parsed.data.upc,
      description: parsed.data.description,
      release_date: parsed.data.releaseDate,
    });
    } catch (err) {
      throw toCatalogError(err);
    }

    if (parsed.data.genreIds?.length) {
      await this.repository.setAlbumGenres(album.id, parsed.data.genreIds);
    }

    if (parsed.data.releaseType === "single") {
      await this.repository.createTrack(creatorId, userId, {
        title: parsed.data.title,
        slug: `${slug}-track`,
        album_id: album.id,
        track_number: 1,
      });
    }

    await this.repository.logAudit("catalog.album.created", "albums", album.id);
    return album;
  }

  async updateAlbum(albumId: string, input: UpdateAlbumInput): Promise<Album> {
    const parsed = updateAlbumSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_album");

    const userId = await this.requireUserId();
    const album = await this.repository.updateAlbum(albumId, userId, {
      title: parsed.data.title,
      release_type: parsed.data.releaseType,
      upc: parsed.data.upc,
      description: parsed.data.description,
      release_date: parsed.data.releaseDate,
    });

    if (parsed.data.genreIds) {
      await this.repository.setAlbumGenres(albumId, parsed.data.genreIds);
    }

    await this.repository.logAudit("catalog.album.updated", "albums", albumId);
    return album;
  }

  async submitAlbum(albumId: string): Promise<void> {
    const integration = new PublicationIntegrationService(this.client);
    try {
      await integration.submitAlbum(albumId, async () => {
        await this.repository.submitAlbum(albumId);
      });
    } catch {
      throw new CatalogError("publish_submit_failed");
    }
  }

  async listTracks(albumId?: string): Promise<Track[]> {
    const creatorId = await this.requireCreatorId();
    return this.repository.listTracks(creatorId, albumId);
  }

  async createTrack(input: CreateTrackInput): Promise<Track> {
    const parsed = createTrackSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_track");

    const userId = await this.requireUserId();
    const creatorId = await this.requireCreatorId();
    const slug = this.repository.buildSlug(parsed.data.title, creatorId);

    let track: Track;
    try {
      track = await this.repository.createTrack(creatorId, userId, {
      title: parsed.data.title,
      slug,
      album_id: parsed.data.albumId,
      track_number: parsed.data.trackNumber,
      isrc: parsed.data.isrc,
      duration_seconds: parsed.data.durationSeconds,
      explicit: parsed.data.explicit,
      language: parsed.data.language,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
    });
    } catch (err) {
      throw toCatalogError(err, "track_create_failed");
    }

    if (parsed.data.genreIds?.length) {
      await this.repository.setTrackGenres(track.id, parsed.data.genreIds);
    }

    await this.repository.logAudit("catalog.track.created", "tracks", track.id);
    return track;
  }

  async updateTrack(trackId: string, input: UpdateTrackInput): Promise<Track> {
    const parsed = updateTrackSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_track");

    const userId = await this.requireUserId();
    const track = await this.repository.updateTrack(trackId, userId, {
      title: parsed.data.title,
      album_id: parsed.data.albumId,
      track_number: parsed.data.trackNumber,
      isrc: parsed.data.isrc,
      duration_seconds: parsed.data.durationSeconds,
      explicit: parsed.data.explicit,
      language: parsed.data.language,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
    });

    if (parsed.data.genreIds) {
      await this.repository.setTrackGenres(trackId, parsed.data.genreIds);
    }

    await this.repository.logAudit("catalog.track.updated", "tracks", trackId);
    return track;
  }

  async submitTrack(trackId: string): Promise<void> {
    const integration = new PublicationIntegrationService(this.client);
    try {
      await integration.submitTrack(trackId, async () => {
        await this.repository.submitTrack(trackId);
      });
    } catch {
      throw new CatalogError("publish_submit_failed");
    }
  }

  async getTrackCredits(trackId: string): Promise<TrackCredit[]> {
    return this.repository.getTrackCredits(trackId);
  }

  async getTracksFeaturingCreator(creatorId: string): Promise<TrackAppearance[]> {
    return this.repository.getTracksFeaturingCreator(creatorId);
  }

  async setTrackCredits(input: SetTrackCreditsInput): Promise<void> {
    const parsed = setTrackCreditsSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_track");
    await this.requireUserId();
    await this.repository.setTrackCredits(parsed.data.trackId, parsed.data.credits);
    await this.repository.logAudit("catalog.track.credits_updated", "track_credits", parsed.data.trackId);
  }

  async requestAssetUploadUrl(input: CatalogAssetUploadInput): Promise<{
    signedUrl: string;
    path: string;
    token: string;
    expiresIn: number;
  }> {
    const parsed = catalogAssetUploadSchema.safeParse(input);
    if (!parsed.success) {
      console.error("[CatalogService.requestAssetUploadUrl] schema fail:", JSON.stringify(parsed.error.flatten()));
      throw new CatalogError("asset_type_invalid");
    }

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("catalog-asset-signed-url", {
      body: {
        action: "upload",
        assetType: parsed.data.assetType,
        creatorId: parsed.data.creatorId,
        contentType: parsed.data.contentType,
        trackId: parsed.data.trackId,
        albumId: parsed.data.albumId,
        format: parsed.data.format,
        bitrateKbps: parsed.data.bitrateKbps,
      },
    });

    if (error || !data?.signedUrl) throw new CatalogError("asset_upload_failed");
    return data as { signedUrl: string; path: string; token: string; expiresIn: number };
  }

  async confirmAssetUpload(input: CatalogAssetConfirmInput): Promise<{
    integrityStatus: string;
    message: string;
    webCompatible: boolean;
    fileSizeBytes: number;
  }> {
    const parsed = catalogAssetConfirmSchema.safeParse(input);
    if (!parsed.success) {
      console.error("[CatalogService.confirmAssetUpload] schema fail:", JSON.stringify(parsed.error.flatten()));
      throw new CatalogError("asset_type_invalid");
    }

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("catalog-asset-signed-url", {
      body: {
        action: "confirm",
        assetType: "audio",
        creatorId: parsed.data.creatorId,
        trackId: parsed.data.trackId,
        path: parsed.data.path,
        format: parsed.data.format,
        contentType: parsed.data.contentType,
        fileSizeBytes: parsed.data.fileSizeBytes,
        durationSeconds: parsed.data.durationSeconds,
        contentHash: parsed.data.contentHash,
      },
    });

    if (error || !data?.integrityStatus) throw new CatalogError("asset_upload_failed");
    return data as {
      integrityStatus: string;
      message: string;
      webCompatible: boolean;
      fileSizeBytes: number;
    };
  }
}

export function createCatalogService(client: SonafrikSupabaseClient): CatalogService {
  return new CatalogService(client);
}
