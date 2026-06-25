import { z } from "zod";

export const preparePublicationRequestSchema = z.object({
  trackId: z.string().uuid(),
  metadataId: z.string().uuid(),
  creatorId: z.string().uuid(),
  proposedIsrc: z
    .string()
    .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/)
    .optional(),
});

export type PreparePublicationRequest = z.infer<typeof preparePublicationRequestSchema>;
