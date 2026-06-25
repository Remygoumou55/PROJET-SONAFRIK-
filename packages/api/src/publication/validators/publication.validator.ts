import { PublicationValidationFailedError } from "../errors";
import {
  preparePublicationRequestSchema,
  type PreparePublicationRequest,
} from "./publication.schemas";

export function validatePreparePublicationRequest(input: unknown): PreparePublicationRequest {
  const result = preparePublicationRequestSchema.safeParse(input);
  if (!result.success) {
    throw new PublicationValidationFailedError(result.error.message);
  }
  return result.data;
}
