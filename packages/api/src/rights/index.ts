export { RightsError } from "./errors";
export { RightsService, createRightsService } from "./rights.service";
export { RightsRepository } from "./rights.repository";
export type {
  CreateWorkInput,
  UpdateWorkInput,
  AddContributorInput,
  SetOwnershipInput,
  CreateContractInput,
  CreateClaimInput,
  WorkIdInput,
  CreatorWorksInput,
} from "./schemas";
