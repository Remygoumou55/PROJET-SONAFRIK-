import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  ArtistProfile,
  Creator,
  CreatorContext,
  CreatorDashboardData,
  CreatorTeamMember,
  CreatorVerification,
  Label,
} from "@sonafrik/types";
import { CREATOR_ERROR_MESSAGES } from "@sonafrik/types";
import { CreatorError } from "./errors";
import { CreatorRepository } from "./creator.repository";
import {
  createLabelSchema,
  createVerificationSchema,
  creatorAssetUploadSchema,
  inviteTeamMemberSchema,
  updateArtistProfileSchema,
  updateLabelSchema,
  updateCoverGallerySchema,
  type CreateLabelInput,
  type CreateVerificationInput,
  type CreatorAssetUploadInput,
  type InviteTeamMemberInput,
  type UpdateArtistProfileInput,
  type UpdateCoverGalleryInput,
  type UpdateLabelInput,
} from "./schemas";
import { resolveCreatorAssetUploadError } from "../shared/uploadSchemaErrors";
import { extractFunctionInvokeMessageAsync } from "../shared/invoke-errors";
import {
  DEV_MOCK_CREATOR_ID,
  DEV_MOCK_USER_ID,
  isDevBypassActive,
} from "@sonafrik/shared/auth";

export class CreatorService {
  private readonly repository: CreatorRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new CreatorRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (user) return user.id;

    if (isDevBypassActive()) return DEV_MOCK_USER_ID;
    throw new CreatorError("unauthorized");
  }

  private async requireArtistAccount(userId: string): Promise<void> {
    if (isDevBypassActive()) return;
    const { data, error } = await this.client.rpc("is_artist_account", { p_user_id: userId });
    if (error || !data) throw new CreatorError("not_artist_account");
  }

  /** Résout le creatorId réel de la session — ignore le mock SSR en local control. */
  private async resolveSelfCreatorId(requestedId: string): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (user) {
      await this.requireArtistAccount(user.id);
      try {
        return await this.repository.ensureCreator();
      } catch (err) {
        this.throwRepositoryError(err, "creator_not_found");
      }
    }

    if (requestedId !== DEV_MOCK_CREATOR_ID) return requestedId;
    throw new CreatorError("unauthorized", "Connectez-vous pour enregistrer une image.");
  }

  private throwRepositoryError(
    err: unknown,
    code: keyof typeof CREATOR_ERROR_MESSAGES = "invalid_artist_profile",
  ): never {
    const detail =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : undefined;
    throw new CreatorError(code, detail);
  }

  async becomeArtist(): Promise<void> {
    const { error } = await this.client.rpc("become_artist_for_current_user");
    if (error) throw error;
  }

  async ensureCreator(): Promise<Creator> {
    const userId = await this.requireUserId();
    await this.requireArtistAccount(userId);
    const creatorId = await this.repository.ensureCreator();
    const creator = await this.repository.getCreator(creatorId);
    if (!creator) throw new CreatorError("creator_not_found");
    return creator;
  }

  async getCreatorContext(): Promise<CreatorContext> {
    const userId = await this.requireUserId();
    await this.requireArtistAccount(userId);

    const creatorId = await this.repository.ensureCreator();
    const [creator, artistProfile, team, labels, verifications, studios] = await Promise.all([
      this.repository.getCreator(creatorId),
      this.repository.getArtistProfile(creatorId),
      this.repository.getTeam(creatorId),
      this.repository.getLabelsForOwner(userId),
      this.repository.getVerifications(creatorId),
      this.repository.getStudios(creatorId),
    ]);

    if (!creator || !artistProfile) throw new CreatorError("creator_not_found");

    return {
      creator,
      artistProfile,
      teamCount: team.length,
      labelCount: labels.length,
      pendingVerifications: verifications.filter((v) => v.status === "pending").length,
      studios,
    };
  }

  async updateArtistIdentity(input: UpdateArtistProfileInput): Promise<ArtistProfile> {
    const parsed = updateArtistProfileSchema.safeParse(input);
    if (!parsed.success) throw new CreatorError("invalid_artist_profile");

    const userId = await this.requireUserId();
    const creatorId = await this.repository.ensureCreator();

    const profile = await this.repository.updateArtistProfile(creatorId, userId, {
      stage_name: parsed.data.stageName,
      bio: parsed.data.bio,
      genres: parsed.data.genres,
      is_public: parsed.data.isPublic,
      social_links: parsed.data.socialLinks,
    });

    if (parsed.data.isPublic !== false) {
      await this.repository.updateCreator(creatorId, userId, { status: "active" });
    }

    await this.repository.logAudit("creator.identity.updated", "artist_profiles", creatorId);
    return profile;
  }

  async createLabel(input: CreateLabelInput): Promise<Label> {
    const parsed = createLabelSchema.safeParse(input);
    if (!parsed.success) throw new CreatorError("invalid_label");

    const userId = await this.requireUserId();
    await this.repository.ensureCreator();

    const label = await this.repository.createLabel(userId, {
      name: parsed.data.name,
      description: parsed.data.description,
      country_code: parsed.data.countryCode?.toUpperCase(),
      website_url: parsed.data.websiteUrl,
    });

    await this.repository.logAudit("creator.label.created", "labels", label.id);
    return label;
  }

  async getMyLabels(): Promise<Label[]> {
    const userId = await this.requireUserId();
    return this.repository.getLabelsForOwner(userId);
  }

  async updateLabel(labelId: string, input: UpdateLabelInput): Promise<Label> {
    const parsed = updateLabelSchema.safeParse(input);
    if (!parsed.success) throw new CreatorError("invalid_label");

    const userId = await this.requireUserId();
    const label = await this.repository.updateLabel(labelId, userId, {
      name: parsed.data.name,
      description: parsed.data.description,
    });

    await this.repository.logAudit("creator.label.updated", "labels", labelId);
    return label;
  }

  async deleteLabel(labelId: string): Promise<void> {
    const userId = await this.requireUserId();
    await this.repository.deleteLabel(labelId, userId);
    await this.repository.logAudit("creator.label.deleted", "labels", labelId);
  }

  async getTeam(): Promise<CreatorTeamMember[]> {
    await this.requireUserId();
    const creatorId = await this.repository.ensureCreator();
    return this.repository.getTeam(creatorId);
  }

  async inviteTeamMember(input: InviteTeamMemberInput): Promise<CreatorTeamMember> {
    const parsed = inviteTeamMemberSchema.safeParse(input);
    if (!parsed.success) throw new CreatorError("invalid_team_member");

    const userId = await this.requireUserId();
    const creatorId = await this.repository.ensureCreator();

    const memberProfile = await this.repository.findProfileByPhone(parsed.data.memberPhone);
    if (!memberProfile) throw new CreatorError("team_member_not_found");

    const member = await this.repository.inviteTeamMember(
      creatorId,
      userId,
      memberProfile.id,
      parsed.data.role,
    );

    await this.repository.logAudit("creator.team.invited", "creator_roles", member.id, {
      role: parsed.data.role,
    });

    return member;
  }

  async removeTeamMember(memberId: string): Promise<void> {
    const userId = await this.requireUserId();
    const creatorId = await this.repository.ensureCreator();
    await this.repository.removeTeamMember(creatorId, memberId, userId);
    await this.repository.logAudit("creator.team.removed", "creator_roles", memberId);
  }

  async getVerifications(): Promise<CreatorVerification[]> {
    const creatorId = await this.repository.ensureCreator();
    return this.repository.getVerifications(creatorId);
  }

  async createVerification(input: CreateVerificationInput): Promise<CreatorVerification> {
    const parsed = createVerificationSchema.safeParse(input);
    if (!parsed.success) throw new CreatorError("verification_not_found");

    const userId = await this.requireUserId();
    const creatorId = await this.repository.ensureCreator();

    const verification = await this.repository.createVerification(creatorId, userId, {
      verification_type: parsed.data.verificationType,
      document_type: parsed.data.documentType,
      label_id: parsed.data.labelId,
      notes: parsed.data.notes,
    });

    await this.repository.logAudit(
      "creator.verification.created",
      "creator_verifications",
      verification.id,
    );

    return verification;
  }

  async submitVerification(verificationId: string): Promise<void> {
    try {
      await this.repository.submitVerification(verificationId);
    } catch {
      throw new CreatorError("verification_submit_failed");
    }
  }

  async requestAssetUploadUrl(input: CreatorAssetUploadInput): Promise<{
    signedUrl: string;
    path: string;
    token: string;
    expiresIn: number;
  }> {
    const parsed = creatorAssetUploadSchema.safeParse(input);
    if (!parsed.success) {
      const detail = JSON.stringify(parsed.error.flatten());
      console.error("[CreatorService.requestAssetUploadUrl] schema fail:", detail);
      throw new CreatorError(resolveCreatorAssetUploadError(parsed.error), detail);
    }

    await this.requireUserId();
    const creatorId = await this.resolveSelfCreatorId(parsed.data.creatorId);

    const { data, error } = await this.client.functions.invoke("creator-asset-signed-url", {
      body: {
        action: "upload",
        creatorId,
        assetKind: parsed.data.assetKind,
        contentType: parsed.data.contentType,
        verificationId: parsed.data.verificationId,
        labelId: parsed.data.labelId,
      },
    });

    if (error) {
      throw new CreatorError("asset_upload_failed", await extractFunctionInvokeMessageAsync(error));
    }
    if (!data?.signedUrl) {
      const remoteMsg = typeof data?.error === "string" ? data.error : undefined;
      throw new CreatorError("asset_upload_failed", remoteMsg);
    }
    return data as { signedUrl: string; path: string; token: string; expiresIn: number };
  }

  async getAssetSignedUrl(
    creatorId: string,
    assetKind: CreatorAssetUploadInput["assetKind"],
    path: string,
  ): Promise<string | null> {
    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("creator-asset-signed-url", {
      body: { action: "read", creatorId, assetKind, path },
    });

    if (error) return null;
    return (data?.signedUrl as string | null) ?? null;
  }

  async removeProfilePhoto(creatorId: string): Promise<ArtistProfile> {
    const userId = await this.requireUserId();
    const resolvedCreatorId = await this.resolveSelfCreatorId(creatorId);
    await this.repository.ensureCreator();
    return this.repository.updateCropData(resolvedCreatorId, userId, {
      profile_photo: null,
      avatar_original_path: null,
    });
  }

  async updateCoverGallery(input: UpdateCoverGalleryInput): Promise<ArtistProfile> {
    const parsed = updateCoverGallerySchema.safeParse(input);
    if (!parsed.success) throw new CreatorError("invalid_artist_profile");

    const userId = await this.requireUserId();
    await this.repository.ensureCreator();

    const coverImages = parsed.data.coverImages;
    return this.repository.updateArtistProfileMedia(parsed.data.creatorId, userId, {
      cover_images: coverImages,
      banner_path: coverImages[0] ?? null,
      cover_updated_at: new Date().toISOString(),
    });
  }

  async saveAvatarCrop(input: {
    creatorId: string;
    croppedPath: string;
    originalPath: string;
    cropX: number;
    cropY: number;
    cropZoom: number;
  }): Promise<ArtistProfile> {
    const userId = await this.requireUserId();
    const creatorId = await this.resolveSelfCreatorId(input.creatorId);
    await this.repository.ensureCreator();
    let updated: ArtistProfile;
    try {
      updated = await this.repository.updateCropData(creatorId, userId, {
        profile_photo: input.croppedPath,
        avatar_original_path: input.originalPath,
        avatar_crop_x: input.cropX,
        avatar_crop_y: input.cropY,
        avatar_crop_zoom: input.cropZoom,
      });
    } catch (err) {
      this.throwRepositoryError(err);
    }

    // A1: edge fn assetKind:"gallery" adds both paths to cover_images[] — remove them
    const avatarPaths = new Set([input.originalPath, input.croppedPath]);
    const cleanImages = updated.cover_images.filter(p => !avatarPaths.has(p));
    if (cleanImages.length !== updated.cover_images.length) {
      try {
        return await this.repository.updateCropData(creatorId, userId, {
          cover_images: cleanImages,
          banner_path: cleanImages[0] ?? null,
        });
      } catch (err) {
        this.throwRepositoryError(err);
      }
    }
    return updated;
  }

  async saveCoverPrimaryCrop(input: {
    creatorId: string;
    croppedPath: string;
    originalPath: string;
    cropX: number;
    cropY: number;
    cropZoom: number;
  }): Promise<ArtistProfile> {
    const userId = await this.requireUserId();
    const creatorId = await this.resolveSelfCreatorId(input.creatorId);
    await this.repository.ensureCreator();
    const profile = await this.repository.getArtistProfile(creatorId);
    const coverImages = profile?.cover_images ?? [];
    // A3: filter duplicates (cropped + original both added by edge fn assetKind:"gallery")
    const filtered = coverImages.filter(
      p => p !== input.croppedPath && p !== input.originalPath,
    );
    const updatedImages = [input.croppedPath, ...filtered.slice(0, 9)];
    try {
      return await this.repository.updateCropData(creatorId, userId, {
        cover_images: updatedImages,
        banner_path: input.croppedPath,
        cover_primary_original: input.originalPath,
        cover_primary_crop_x: input.cropX,
        cover_primary_crop_y: input.cropY,
        cover_primary_crop_zoom: input.cropZoom,
      });
    } catch (err) {
      this.throwRepositoryError(err);
    }
  }

  async getDashboardData(): Promise<CreatorDashboardData> {
    const { CreatorDashboardService } = await import("./creatorDashboard.service");
    return new CreatorDashboardService(this.client).getDashboardData();
  }

  async getDashboardDataForContext(context: CreatorContext): Promise<CreatorDashboardData> {
    const { CreatorDashboardService } = await import("./creatorDashboard.service");
    return new CreatorDashboardService(this.client).getDashboardDataForContext(context);
  }
}

export function createCreatorService(client: SonafrikSupabaseClient): CreatorService {
  return new CreatorService(client);
}
