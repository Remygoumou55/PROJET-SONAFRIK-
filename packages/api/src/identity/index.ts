export { IdentityService, createIdentityService } from "./identity.service";
export { IdentityRepository } from "./identity.repository";
export { IdentityError } from "./errors";
export {
  updateProfileSchema,
  updatePreferencesSchema,
  avatarUploadRequestSchema,
} from "./schemas";
export type {
  UpdateProfileInput,
  UpdatePreferencesInput,
  AvatarUploadRequestInput,
} from "./schemas";
