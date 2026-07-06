import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type {
  Work,
  Contributor,
  Ownership,
  Contract,
  RightsClaim,
  WorkWithDetails,
  ContributorRole,
  OwnershipType,
  ContractType,
  RightsClaimType,
} from "@sonafrik/types";

export class RightsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listWorksByCreator(
    creatorId: string,
    limit: number,
    offset: number,
  ): Promise<Work[]> {
    const { data, error } = await this.client
      .from("works")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data as unknown as Work[]) ?? [];
  }

  async getWorkWithDetails(workId: string): Promise<WorkWithDetails | null> {
    const [workRes, contribRes, contractRes, claimRes] = await Promise.all([
      this.client
        .from("works")
        .select("*")
        .eq("id", workId)
        .is("deleted_at", null),
      this.client
        .from("contributors")
        .select("*, ownerships(*)")
        .eq("work_id", workId),
      this.client
        .from("contracts")
        .select("*")
        .eq("work_id", workId)
        .is("deleted_at", null),
      this.client
        .from("rights_claims")
        .select("*")
        .eq("work_id", workId),
    ]);

    if (workRes.error) throw workRes.error;

    const works = (workRes.data as unknown as Work[]) ?? [];
    if (works.length === 0) return null;

    const base = works[0] as Work;
    return {
      ...base,
      contributors: (contribRes.data as unknown as (Contributor & { ownerships: Ownership[] })[]) ?? [],
      contracts:    (contractRes.data as unknown as Contract[]) ?? [],
      claims:       (claimRes.data as unknown as RightsClaim[]) ?? [],
    } as WorkWithDetails;
  }

  async createWork(
    creatorId: string,
    title: string,
    iswc: string | undefined,
    genre: string | undefined,
    language: string,
    description: string | undefined,
  ): Promise<Work> {
    const { data, error } = await this.client
      .from("works")
      .insert({
        creator_id:  creatorId,
        title,
        iswc:        iswc ?? null,
        genre:       genre ?? null,
        language,
        description: description ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Work;
  }

  async updateWork(
    workId: string,
    patch: Partial<Pick<Work, "title" | "iswc" | "genre" | "language" | "description">>,
  ): Promise<Work> {
    const { data, error } = await this.client
      .from("works")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", workId)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Work;
  }

  async softDeleteWork(workId: string): Promise<void> {
    const { error } = await this.client
      .from("works")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", workId);
    if (error) throw error;
  }

  async addContributor(
    workId: string,
    displayName: string,
    role: ContributorRole,
    profileId?: string,
    ipi?: string,
  ): Promise<Contributor> {
    const { data, error } = await this.client
      .from("contributors")
      .insert({
        work_id:      workId,
        display_name: displayName,
        role,
        profile_id:   profileId ?? null,
        ipi:          ipi ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Contributor;
  }

  async setOwnership(
    workId: string,
    contributorId: string,
    sharePercent: number,
    ownershipType: OwnershipType,
    territory: string,
  ): Promise<Ownership> {
    const { data, error } = await this.client
      .from("ownerships")
      .upsert(
        {
          work_id:        workId,
          contributor_id: contributorId,
          share_percent:  sharePercent,
          ownership_type: ownershipType,
          territory,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: "work_id,contributor_id,ownership_type,territory" },
      )
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Ownership;
  }

  async deleteOwnership(ownershipId: string): Promise<void> {
    const { error } = await this.client
      .from("ownerships")
      .delete()
      .eq("id", ownershipId);
    if (error) throw error;
  }

  async snapshotOwnership(workId: string, userId: string): Promise<void> {
    const [ownRes, versionRes] = await Promise.all([
      this.client
        .from("ownerships")
        .select("*")
        .eq("work_id", workId),
      this.client
        .from("ownership_versions")
        .select("version_number")
        .eq("work_id", workId),
    ]);

    const ownerships = (ownRes.data as unknown as Ownership[]) ?? [];
    const versions   = (versionRes.data as unknown as { version_number: number }[]) ?? [];
    const maxVersion = versions.reduce((max, v) => Math.max(max, v.version_number), 0);

    await this.client
      .from("ownership_versions")
      .insert({
        work_id:        workId,
        version_number: maxVersion + 1,
        snapshot:       { ownerships } as unknown as Json,
        created_by:     userId,
      });
  }

  async createContract(
    workId: string,
    creatorId: string,
    counterpartyName: string,
    contractType: ContractType,
    startDate?: string,
    endDate?: string,
    revenueSharePercent?: number,
    terms?: string,
    signedAt?: string,
  ): Promise<Contract> {
    const { data, error } = await this.client
      .from("contracts")
      .insert({
        work_id:               workId,
        creator_id:            creatorId,
        counterparty_name:     counterpartyName,
        contract_type:         contractType,
        start_date:            startDate ?? null,
        end_date:              endDate ?? null,
        revenue_share_percent: revenueSharePercent ?? null,
        terms:                 terms ?? null,
        signed_at:             signedAt ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Contract;
  }

  async createClaim(
    workId: string,
    claimantId: string,
    claimType: RightsClaimType,
    description: string,
    evidenceUrl?: string,
  ): Promise<RightsClaim> {
    const { data, error } = await this.client
      .from("rights_claims")
      .insert({
        work_id:      workId,
        claimant_id:  claimantId,
        claim_type:   claimType,
        description,
        evidence_url: evidenceUrl ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as RightsClaim;
  }
}
