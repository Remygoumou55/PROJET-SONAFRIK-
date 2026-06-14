import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  ArtistProfile,
  Creator,
  CreatorContext,
  CreatorTeamMember,
  CreatorVerification,
  Label,
} from "@sonafrik/types";
import { CreatorError } from "./errors";
import { CreatorRepository } from "./creator.repository";
import {
  createLabelSchema,
  createVerificationSchema,
  creatorAssetUploadSchema,
  inviteTeamMemberSchema,
  updateArtistProfileSchema,
  type CreateLabelInput,
  type CreateVerificationInput,
  type CreatorAssetUploadInput,
  type InviteTeamMemberInput,
  type UpdateArtistProfileInput,
} from "./schemas";

export class CreatorService {
  private readonly repository: CreatorRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new CreatorRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new CreatorError("unauthorized");
    return user.id;
  }

  private async requireArtistAccount(userId: string): Promise<void> {
    const { data, error } = await this.client.rpc("is_artist_account", { p_user_id: userId });
    if (error || !data) throw new CreatorError("not_artist_account");
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
    if (!parsed.success) throw new CreatorError("asset_type_invalid");

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("creator-asset-signed-url", {
      body: {
        action: "upload",
        creatorId: parsed.data.creatorId,
        assetKind: parsed.data.assetKind,
        contentType: parsed.data.contentType,
        verificationId: parsed.data.verificationId,
        labelId: parsed.data.labelId,
      },
    });

    if (error || !data?.signedUrl) throw new CreatorError("asset_upload_failed");
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
}

export function createCreatorService(client: SonafrikSupabaseClient): CreatorService {
  return new CreatorService(client);
}
