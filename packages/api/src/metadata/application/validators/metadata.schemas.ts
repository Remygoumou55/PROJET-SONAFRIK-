import { z } from "zod";

export const metadataRecordInputSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum([
    "track",
    "album",
    "artist",
    "release",
    "royalty",
    "distribution",
    "fingerprint",
    "version",
    "audit",
    "storage",
    "delivery",
  ]),
  entityId: z.string().min(1),
  status: z
    .enum(["draft", "ready", "validated", "published", "archived", "deleted"])
    .default("draft"),
  source: z.enum(["manual", "generated", "imported", "migrated"]).default("manual"),
  visibility: z.enum(["private", "internal", "public"]).default("private"),
  validationState: z.enum(["pending", "passed", "failed", "skipped"]).default("pending"),
  version: z.number().int().positive().default(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const isrcValueSchema = z
  .string()
  .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/, "Format ISRC invalide");

export const searchMetadataSchema = z.object({
  status: z.string().optional(),
  entityType: z.string().optional(),
  creatorId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type MetadataRecordInput = z.infer<typeof metadataRecordInputSchema>;
export type SearchMetadataInput = z.infer<typeof searchMetadataSchema>;
