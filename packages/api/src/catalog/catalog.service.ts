import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Album, CatalogContext, Genre, Track, TrackAppearance, TrackCredit, TrackFile } from "@sonafrik/types";
import { CATALOG_ERROR_MESSAGES } from "@sonafrik/types";
import { CatalogError } from "./errors";
import { CatalogRepository } from "./catalog.repository";
import {
  catalogAssetUploadSchema,
  catalogAssetConfirmSchema,
  catalogCoverConfirmSchema,
  createAlbumSchema,
  createTrackSchema,
  setTrackCreditsSchema,
  updateAlbumSchema,
  updateTrackSchema,
  type CatalogAssetUploadInput,
  type CatalogAssetConfirmInput,
  type CatalogCoverConfirmInput,
  type CreateAlbumInput,
  type CreateTrackInput,
  type SetTrackCreditsInput,
  type UpdateAlbumInput,
  type UpdateTrackInput,
} from "./schemas";
import { DEV_MOCK_CREATOR_ID } from "@sonafrik/shared/auth";
import {
  coverStatusFromSource,
  type CoverSource,
} from "./artwork";
import { coverSourceSchema } from "./schemas";
import {
  resolveCatalogAssetConfirmError,
  resolveCatalogAssetUploadError,
} from "../shared/uploadSchemaErrors";
import {
  MetadataAutomaticEngine,
  wizardUserMetadataSchema,
  type WizardUserMetadataInput,
} from "./metadata";
import { extractFunctionInvokeMessageAsync } from "../shared/invoke-errors";
import { uploadAssetToSignedUrl } from "../shared/uploadRuntime";

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

    if (isDevBypass()) return DEV_MOCK_CREATOR_ID;
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

  async getTrackFiles(trackId: string): Promise<TrackFile[]> {
    await this.requireUserId();
    return this.repository.getTrackFiles(trackId);
  }

  async assertAlbumReadyForSubmit(albumId: string): Promise<void> {
    const creatorId = await this.requireCreatorId();
    const album = await this.repository.getAlbum(albumId);
    if (!album || album.creator_id !== creatorId) {
      throw new CatalogError("album_not_found");
    }
    if (!album.cover_path?.trim()) {
      throw new CatalogError(
        "publish_submit_failed",
        "La pochette n'est pas encore définie. Revenez à l'étape Fichiers du wizard.",
      );
    }

    const tracks = await this.repository.listTracks(creatorId, albumId);

    if (tracks.length === 0) {
      throw new CatalogError("publish_submit_failed", "Ajoutez au moins un morceau avant de soumettre.");
    }

    for (const track of tracks) {
      const files = await this.repository.getTrackFiles(track.id);
      const primary = files.find((file) => file.is_primary);
      if (!primary || primary.integrity_status !== "valid") {
        throw new CatalogError(
          "publish_submit_failed",
          `Le morceau « ${track.title} » doit avoir un fichier audio validé avant soumission.`,
        );
      }
    }
  }

  async submitAlbum(albumId: string): Promise<void> {
    await this.assertAlbumReadyForSubmit(albumId);
    await this.applyPublicationAutomaticMetadata(albumId);

    const { PublicationIntegrationService } = await import("../publication/integration");
    const integration = new PublicationIntegrationService(this.client);
    try {
      await integration.submitAlbum(albumId, async () => {
        await this.repository.submitAlbum(albumId);
      });
    } catch (err) {
      if (err instanceof CatalogError) throw err;
      throw new CatalogError(
        "publish_submit_failed",
        err instanceof Error ? err.message : undefined,
      );
    }
  }

  async listTracks(albumId?: string): Promise<Track[]> {
    const creatorId = await this.requireCreatorId();
    return this.repository.listTracks(creatorId, albumId);
  }

  async listTracksPage(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }): Promise<{
    tracks: Track[];
    total: number;
  }> {
    const creatorId = await this.requireCreatorId();
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const filters = { search: options?.search, status: options?.status };
    const [tracks, total] = await Promise.all([
      this.repository.listCreatorTracksPaginated(creatorId, limit, offset, filters),
      this.repository.countCreatorTracks(creatorId, filters),
    ]);
    return { tracks, total };
  }

  async getTrackGenreIds(trackId: string): Promise<string[]> {
    await this.requireUserId();
    return this.repository.getTrackGenreIds(trackId);
  }

  async getAlbum(albumId: string): Promise<Album> {
    const creatorId = await this.requireCreatorId();
    const album = await this.repository.getAlbum(albumId);
    if (!album || album.creator_id !== creatorId) throw new CatalogError("album_not_found");
    return album;
  }

  async requestCoverReadUrl(input: { creatorId: string; path: string }): Promise<{ signedUrl: string }> {
    await this.requireCreatorId();
    const { data, error } = await this.client.functions.invoke("catalog-asset-signed-url", {
      body: {
        action: "read",
        assetType: "cover",
        creatorId: input.creatorId,
        path: input.path,
      },
    });
    if (error) {
      throw new CatalogError(
        "asset_upload_failed",
        await extractFunctionInvokeMessageAsync(error),
      );
    }
    if (!data?.signedUrl) {
      const remoteMsg = typeof data?.error === "string" ? data.error : undefined;
      throw new CatalogError("asset_upload_failed", remoteMsg);
    }
    return { signedUrl: data.signedUrl as string };
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
    const { PublicationIntegrationService } = await import("../publication/integration");
    const integration = new PublicationIntegrationService(this.client);
    try {
      await integration.submitTrack(trackId, async () => {
        await this.repository.submitTrack(trackId);
      });
    } catch (err) {
      if (err instanceof CatalogError) throw err;
      throw new CatalogError(
        "publish_submit_failed",
        err instanceof Error ? err.message : undefined,
      );
    }
  }

  async getTrack(trackId: string): Promise<Track> {
    await this.requireUserId();
    const creatorId = await this.requireCreatorId();
    const track = await this.repository.getTrack(trackId);
    if (!track) throw new CatalogError("track_not_found");
    if (track.creator_id !== creatorId) throw new CatalogError("unauthorized");
    return track;
  }

  async deleteTrack(trackId: string): Promise<void> {
    const userId = await this.requireUserId();
    const track = await this.getTrack(trackId);
    if (track.publication_status !== "draft" && track.publication_status !== "rejected") {
      throw new CatalogError("track_not_editable");
    }
    try {
      await this.repository.softDeleteTrack(trackId, userId);
      await this.repository.logAudit("catalog.track.deleted", "tracks", trackId);
    } catch (err) {
      throw new CatalogError(
        "track_delete_failed",
        err instanceof Error ? err.message : undefined,
      );
    }
  }

  async deleteAlbum(albumId: string): Promise<void> {
    const userId = await this.requireUserId();
    const creatorId = await this.requireCreatorId();
    const album = await this.repository.getAlbum(albumId);
    if (!album || album.creator_id !== creatorId) throw new CatalogError("album_not_found");
    if (album.publication_status !== "draft" && album.publication_status !== "rejected") {
      throw new CatalogError("track_not_editable");
    }
    try {
      await this.repository.softDeleteAlbum(albumId, userId);
      await this.repository.logAudit("catalog.album.deleted", "albums", albumId);
    } catch (err) {
      throw new CatalogError(
        "album_delete_failed",
        err instanceof Error ? err.message : undefined,
      );
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

  /**
   * MAE — Étape 3 Publication Wizard.
   * L'utilisateur ne fournit que genre + langue ; le reste est généré automatiquement.
   */
  async saveWizardUserMetadata(input: WizardUserMetadataInput): Promise<void> {
    const parsed = wizardUserMetadataSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_track");

    const creatorId = await this.requireCreatorId();
    const userId = await this.requireUserId();
    const stageName = await this.repository.getArtistStageName(creatorId);

    const engine = new MetadataAutomaticEngine({
      creatorId,
      userId,
      stageName,
      validatedAt: new Date(),
    });

    const { trackUpdate } = engine.buildWizardTrackPatch(parsed.data);
    const mergedTrackUpdate = {
      ...trackUpdate,
      ...(parsed.data.explicit === true ? { explicit: true } : {}),
    };
    await this.updateTrack(parsed.data.trackId, mergedTrackUpdate);

    const lyrics = parsed.data.lyrics?.trim();
    if (lyrics) {
      await this.repository.patchTrackMetadata(parsed.data.trackId, userId, {
        wizard_lyrics_draft: lyrics,
      });
    }

    await this.repository.logAudit("catalog.wizard.metadata_saved", "tracks", parsed.data.trackId, {
      genreId: parsed.data.genreId,
      language: parsed.data.language,
      ...engine.buildSystemIdentity(),
    });
  }

  private async applyPublicationAutomaticMetadata(albumId: string): Promise<void> {
    const creatorId = await this.requireCreatorId();
    const userId = await this.requireUserId();
    const stageName = await this.repository.getArtistStageName(creatorId);
    const validatedAt = new Date();

    const engine = new MetadataAutomaticEngine({
      creatorId,
      userId,
      stageName,
      validatedAt,
    });

    const { albumUpdate, publishedAtIso } = engine.buildPublicationAlbumPatch(validatedAt);
    await this.updateAlbum(albumId, albumUpdate);

    const tracks = await this.repository.listTracks(creatorId, albumId);
    const credits = engine.buildAutomaticCredits();

    await Promise.all(
      tracks.map(async (track) => {
        await this.setTrackCredits({ trackId: track.id, credits });
      }),
    );

    await this.repository.patchAlbumMetadata(albumId, userId, {
      mae_publication_applied_at: publishedAtIso,
      mae_creator_id: creatorId,
      mae_user_id: userId,
    });
  }

  async requestAssetUploadUrl(input: CatalogAssetUploadInput): Promise<{
    signedUrl: string;
    path: string;
    token: string;
    expiresIn: number;
  }> {
    const parsed = catalogAssetUploadSchema.safeParse(input);
    if (!parsed.success) {
      const detail = JSON.stringify(parsed.error.flatten());
      if (process.env.NODE_ENV === "development") {
        console.error("[CatalogService.requestAssetUploadUrl] schema fail:", detail);
      }
      const code = resolveCatalogAssetUploadError(parsed.error);
      throw new CatalogError(
        code,
        process.env.NODE_ENV === "development"
          ? `${CATALOG_ERROR_MESSAGES[code]} [dev: ${detail}]`
          : undefined,
      );
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

    if (error) {
      throw new CatalogError(
        "asset_upload_failed",
        await extractFunctionInvokeMessageAsync(error),
      );
    }
    if (!data?.signedUrl) {
      const remoteMsg = typeof data?.error === "string" ? data.error : undefined;
      throw new CatalogError("asset_upload_failed", remoteMsg);
    }
    return data as { signedUrl: string; path: string; token: string; expiresIn: number };
  }

  async confirmCoverUpload(input: CatalogCoverConfirmInput): Promise<{ path: string }> {
    const parsed = catalogCoverConfirmSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_album");

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("catalog-asset-signed-url", {
      body: {
        action: "confirm",
        assetType: "cover",
        creatorId: parsed.data.creatorId,
        albumId: parsed.data.albumId,
        path: parsed.data.path,
      },
    });

    if (error) {
      throw new CatalogError(
        "asset_upload_failed",
        await extractFunctionInvokeMessageAsync(error),
      );
    }
    if (!data?.path) {
      const remoteMsg = typeof data?.error === "string" ? data.error : undefined;
      throw new CatalogError("asset_upload_failed", remoteMsg);
    }
    return { path: data.path as string };
  }

  async confirmCoverUploadWithRetry(
    input: CatalogCoverConfirmInput,
    maxAttempts = 3,
  ): Promise<{ path: string }> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.confirmCoverUpload(input);
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : "";
        const retryable =
          msg.includes("Pochette introuvable") || msg.includes("introuvable en Storage");
        if (!retryable || attempt === maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    }
    throw lastError;
  }

  async applyCoverArtworkState(albumId: string, source: CoverSource): Promise<void> {
    const parsed = coverSourceSchema.safeParse(source);
    if (!parsed.success) throw new CatalogError("invalid_album");

    const userId = await this.requireUserId();
    await this.repository.patchAlbumCoverArtworkState(albumId, userId, {
      source: parsed.data,
      status: coverStatusFromSource(parsed.data),
    });
  }

  async uploadCoverBlob(input: {
    creatorId: string;
    albumId: string;
    blob: Blob;
    contentType?: string;
    source: CoverSource;
  }): Promise<{ path: string }> {
    const contentType = input.contentType ?? "image/jpeg";
    const { signedUrl, path } = await this.requestAssetUploadUrl({
      creatorId: input.creatorId,
      assetType: "cover",
      contentType,
      albumId: input.albumId,
    });

    try {
      await uploadAssetToSignedUrl(signedUrl, input.blob, { contentType });
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      throw new CatalogError("asset_upload_failed", msg);
    }

    const confirmed = await this.confirmCoverUploadWithRetry({
      creatorId: input.creatorId,
      albumId: input.albumId,
      path,
    });
    await this.applyCoverArtworkState(input.albumId, input.source);
    return confirmed;
  }

  async confirmAssetUpload(input: CatalogAssetConfirmInput): Promise<{
    integrityStatus: string;
    message: string;
    webCompatible: boolean;
    fileSizeBytes: number;
  }> {
    const parsed = catalogAssetConfirmSchema.safeParse(input);
    if (!parsed.success) {
      const detail = JSON.stringify(parsed.error.flatten());
      if (process.env.NODE_ENV === "development") {
        console.error("[CatalogService.confirmAssetUpload] schema fail:", detail);
      }
      const code = resolveCatalogAssetConfirmError(parsed.error);
      throw new CatalogError(
        code,
        process.env.NODE_ENV === "development"
          ? `${CATALOG_ERROR_MESSAGES[code]} [dev: ${detail}]`
          : undefined,
      );
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

    if (error) {
      throw new CatalogError(
        "asset_upload_failed",
        await extractFunctionInvokeMessageAsync(error),
      );
    }
    if (!data?.integrityStatus) {
      const remoteMsg = typeof data?.error === "string" ? data.error : undefined;
      throw new CatalogError("asset_upload_failed", remoteMsg);
    }
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
