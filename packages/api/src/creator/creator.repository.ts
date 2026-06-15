import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type {
  ArtistProfile,
  Creator,
  CreatorTeamMember,
  CreatorVerification,
  Label,
  LabelMember,
  Studio,
} from "@sonafrik/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class CreatorRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async ensureCreator(): Promise<string> {
    const { data, error } = await this.client.rpc("ensure_creator_for_current_user");
    if (error) throw error;
    return data as string;
  }

  async getCreatorByOwner(ownerId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select("*")
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data as Creator | null;
  }

  async getCreator(creatorId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select("*")
      .eq("id", creatorId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data as Creator | null;
  }

  async updateCreator(
    creatorId: string,
    userId: string,
    updates: Partial<Pick<Creator, "status" | "label_id">>,
  ): Promise<Creator> {
    const { data, error } = await this.client
      .from("creators")
      .update({ ...updates, updated_by: userId })
      .eq("id", creatorId)
      .select("*")
      .single();

    if (error) throw error;
    return data as Creator;
  }

  async getArtistProfile(creatorId: string): Promise<ArtistProfile | null> {
    const { data, error } = await this.client
      .from("artist_profiles")
      .select("*")
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
      ...(data as ArtistProfile),
      social_links: (data.social_links as Record<string, string>) ?? {},
    };
  }

  async updateArtistProfile(
    creatorId: string,
    userId: string,
    updates: {
      stage_name?: string;
      bio?: string | null;
      genres?: string[];
      is_public?: boolean;
      social_links?: Record<string, string>;
    },
  ): Promise<ArtistProfile> {
    const { data, error } = await this.client
      .from("artist_profiles")
      .update({ ...updates, updated_by: userId })
      .eq("creator_id", creatorId)
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as ArtistProfile),
      social_links: (data.social_links as Record<string, string>) ?? {},
    };
  }

  async getTeam(creatorId: string): Promise<CreatorTeamMember[]> {
    const { data, error } = await this.client
      .from("creator_roles")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as CreatorTeamMember[];
  }

  async findProfileByPhone(phone: string): Promise<{ id: string } | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async inviteTeamMember(
    creatorId: string,
    userId: string,
    memberId: string,
    role: CreatorTeamMember["role"],
  ): Promise<CreatorTeamMember> {
    const { data, error } = await this.client
      .from("creator_roles")
      .insert({
        creator_id: creatorId,
        member_id: memberId,
        role,
        invited_by: userId,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as CreatorTeamMember;
  }

  async removeTeamMember(creatorId: string, memberId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("creator_roles")
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq("creator_id", creatorId)
      .eq("member_id", memberId)
      .neq("role", "owner");

    if (error) throw error;
  }

  async getLabelsForOwner(ownerId: string): Promise<Label[]> {
    const { data, error } = await this.client
      .from("labels")
      .select("*")
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Label[];
  }

  async createLabel(
    ownerId: string,
    input: { name: string; description?: string | null; country_code?: string; website_url?: string | null },
  ): Promise<Label> {
    const baseSlug = slugify(input.name);
    const slug = `${baseSlug}-${ownerId.slice(0, 8)}`;

    const { data, error } = await this.client
      .from("labels")
      .insert({
        name: input.name,
        slug,
        owner_id: ownerId,
        description: input.description ?? null,
        country_code: input.country_code ?? "GN",
        website_url: input.website_url ?? null,
        created_by: ownerId,
        updated_by: ownerId,
      })
      .select("*")
      .single();

    if (error) throw error;

    await this.client.from("label_members").insert({
      label_id: data.id,
      member_id: ownerId,
      role: "owner",
      invited_by: ownerId,
      updated_by: ownerId,
    });

    return data as Label;
  }

  async updateLabel(
    labelId: string,
    ownerId: string,
    updates: { name?: string; description?: string | null },
  ): Promise<Label> {
    const { data, error } = await this.client
      .from("labels")
      .update({ ...updates, updated_by: ownerId })
      .eq("id", labelId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw error;
    return data as Label;
  }

  async deleteLabel(labelId: string, ownerId: string): Promise<void> {
    const { error } = await this.client
      .from("labels")
      .update({ deleted_at: new Date().toISOString(), updated_by: ownerId })
      .eq("id", labelId)
      .eq("owner_id", ownerId);

    if (error) throw error;
  }

  async getLabelMembers(labelId: string): Promise<LabelMember[]> {
    const { data, error } = await this.client
      .from("label_members")
      .select("*")
      .eq("label_id", labelId)
      .is("deleted_at", null);

    if (error) throw error;
    return (data ?? []) as LabelMember[];
  }

  async getStudios(creatorId: string): Promise<Studio[]> {
    const { data, error } = await this.client
      .from("studios")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Studio[];
  }

  async getVerifications(creatorId: string): Promise<CreatorVerification[]> {
    const { data, error } = await this.client
      .from("creator_verifications")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...(row as CreatorVerification),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }

  async createVerification(
    creatorId: string,
    userId: string,
    input: {
      verification_type: CreatorVerification["verification_type"];
      document_type?: CreatorVerification["document_type"];
      label_id?: string | null;
      notes?: string | null;
    },
  ): Promise<CreatorVerification> {
    const { data, error } = await this.client
      .from("creator_verifications")
      .insert({
        creator_id: creatorId,
        verification_type: input.verification_type,
        document_type: input.document_type ?? null,
        label_id: input.label_id ?? null,
        notes: input.notes ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as CreatorVerification),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  }

  async submitVerification(verificationId: string): Promise<void> {
    const { error } = await this.client.rpc("submit_creator_verification", {
      p_verification_id: verificationId,
    });
    if (error) throw error;
  }

  async logAudit(
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client.rpc("log_audit_event_authenticated", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: (metadata ?? {}) as Json,
    });
    if (error) throw error;
  }

  buildSlug(name: string, suffix: string): string {
    const base = slugify(name);
    return `${base || "label"}-${suffix.slice(0, 8)}`;
  }
}
