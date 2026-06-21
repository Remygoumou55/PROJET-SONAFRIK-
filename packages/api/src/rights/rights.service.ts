import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type {
  Work,
  Contributor,
  Ownership,
  Contract,
  RightsClaim,
  WorkWithDetails,
} from "@sonafrik/types";
import { RightsError } from "./errors";
import { RightsRepository } from "./rights.repository";
import {
  createWorkSchema,
  updateWorkSchema,
  addContributorSchema,
  setOwnershipSchema,
  createContractSchema,
  createClaimSchema,
  workIdSchema,
  creatorWorksSchema,
  type CreateWorkInput,
  type UpdateWorkInput,
  type AddContributorInput,
  type SetOwnershipInput,
  type CreateContractInput,
  type CreateClaimInput,
  type WorkIdInput,
  type CreatorWorksInput,
} from "./schemas";

export class RightsService {
  private readonly repository: RightsRepository;

  constructor(private readonly client: SupabaseClient<Database>) {
    this.repository = new RightsRepository(client);
  }

  private async requireUserId(): Promise<string> {
    if (process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1") return "dev-mock-id";
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new RightsError("unauthorized");
    return user.id;
  }

  async listWorks(input: CreatorWorksInput): Promise<Work[]> {
    const parsed = creatorWorksSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_work");
    try {
      return await this.repository.listWorksByCreator(
        parsed.data.creatorId,
        parsed.data.limit,
        parsed.data.offset,
      );
    } catch {
      throw new RightsError("work_not_found");
    }
  }

  async getWorkDetails(input: WorkIdInput): Promise<WorkWithDetails | null> {
    const parsed = workIdSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("work_not_found");
    try {
      return await this.repository.getWorkWithDetails(parsed.data.workId);
    } catch {
      throw new RightsError("work_not_found");
    }
  }

  async createWork(input: CreateWorkInput): Promise<Work> {
    const parsed = createWorkSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_work");
    try {
      return await this.repository.createWork(
        parsed.data.creatorId,
        parsed.data.title,
        parsed.data.iswc,
        parsed.data.genre,
        parsed.data.language,
        parsed.data.description,
      );
    } catch {
      throw new RightsError("work_create_failed");
    }
  }

  async updateWork(input: UpdateWorkInput): Promise<Work> {
    const parsed = updateWorkSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_work");
    const { workId, ...patch } = parsed.data;
    try {
      return await this.repository.updateWork(workId, patch);
    } catch {
      throw new RightsError("work_update_failed");
    }
  }

  async deleteWork(input: WorkIdInput): Promise<void> {
    const parsed = workIdSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("work_not_found");
    try {
      await this.repository.softDeleteWork(parsed.data.workId);
    } catch {
      throw new RightsError("work_update_failed");
    }
  }

  async addContributor(input: AddContributorInput): Promise<Contributor> {
    const parsed = addContributorSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_contributor");
    try {
      return await this.repository.addContributor(
        parsed.data.workId,
        parsed.data.displayName,
        parsed.data.role,
        parsed.data.profileId,
        parsed.data.ipi,
      );
    } catch {
      throw new RightsError("contributor_add_failed");
    }
  }

  async setOwnership(input: SetOwnershipInput): Promise<Ownership> {
    const parsed = setOwnershipSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_ownership");
    try {
      return await this.repository.setOwnership(
        parsed.data.workId,
        parsed.data.contributorId,
        parsed.data.sharePercent,
        parsed.data.ownershipType,
        parsed.data.territory,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("dépasse 100")) throw new RightsError("ownership_exceeds_100");
      throw new RightsError("ownership_set_failed");
    }
  }

  async snapshotOwnership(workId: string): Promise<void> {
    const userId = await this.requireUserId();
    try {
      await this.repository.snapshotOwnership(workId, userId);
    } catch {
      // non-critical — snapshot failure should not block the user
    }
  }

  async createContract(input: CreateContractInput): Promise<Contract> {
    const parsed = createContractSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_contract");
    try {
      return await this.repository.createContract(
        parsed.data.workId,
        parsed.data.creatorId,
        parsed.data.counterpartyName,
        parsed.data.contractType,
        parsed.data.startDate,
        parsed.data.endDate,
        parsed.data.revenueSharePercent,
        parsed.data.terms,
        parsed.data.signedAt,
      );
    } catch {
      throw new RightsError("contract_create_failed");
    }
  }

  async createClaim(input: CreateClaimInput): Promise<RightsClaim> {
    const parsed = createClaimSchema.safeParse(input);
    if (!parsed.success) throw new RightsError("invalid_claim");
    const userId = await this.requireUserId();
    try {
      return await this.repository.createClaim(
        parsed.data.workId,
        userId,
        parsed.data.claimType,
        parsed.data.description,
        parsed.data.evidenceUrl,
      );
    } catch {
      throw new RightsError("claim_create_failed");
    }
  }
}

export function createRightsService(client: SupabaseClient<Database>): RightsService {
  return new RightsService(client);
}
