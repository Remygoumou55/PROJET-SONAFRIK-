import { z } from "zod";

export const createWorkSchema = z.object({
  creatorId:   z.string().uuid(),
  title:       z.string().min(1).max(200),
  iswc:        z.string().regex(/^T-\d{3}\.\d{3}\.\d{3}-\d$/).optional(),
  genre:       z.string().max(50).optional(),
  language:    z.string().length(2).default("fr"),
  description: z.string().max(1000).optional(),
});

export const updateWorkSchema = z.object({
  workId:      z.string().uuid(),
  title:       z.string().min(1).max(200).optional(),
  iswc:        z.string().regex(/^T-\d{3}\.\d{3}\.\d{3}-\d$/).nullable().optional(),
  genre:       z.string().max(50).nullable().optional(),
  language:    z.string().length(2).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const addContributorSchema = z.object({
  workId:      z.string().uuid(),
  profileId:   z.string().uuid().optional(),
  displayName: z.string().min(1).max(100),
  role:        z.enum(["author", "composer", "lyricist", "producer", "arranger", "performer"]),
  ipi:         z.string().max(20).optional(),
});

export const setOwnershipSchema = z.object({
  workId:        z.string().uuid(),
  contributorId: z.string().uuid(),
  sharePercent:  z.number().gt(0).lte(100),
  ownershipType: z.enum(["master", "publishing", "neighboring"]).default("master"),
  territory:     z.string().default("worldwide"),
});

export const createContractSchema = z.object({
  workId:               z.string().uuid(),
  creatorId:            z.string().uuid(),
  counterpartyName:     z.string().min(1).max(200),
  contractType:         z.enum(["sync", "license", "distribution", "publishing", "management"]),
  startDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:              z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  revenueSharePercent:  z.number().min(0).max(100).optional(),
  terms:                z.string().max(5000).optional(),
  signedAt:             z.string().datetime({ offset: true }).optional(),
});

export const createClaimSchema = z.object({
  workId:      z.string().uuid(),
  claimType:   z.enum(["ownership", "infringement", "takedown"]),
  description: z.string().min(10).max(2000),
  evidenceUrl: z.string().url().optional(),
});

export const workIdSchema = z.object({
  workId: z.string().uuid(),
});

export const creatorWorksSchema = z.object({
  creatorId: z.string().uuid(),
  limit:     z.number().int().min(1).max(100).default(50),
  offset:    z.number().int().min(0).default(0),
});

export type CreateWorkInput      = z.infer<typeof createWorkSchema>;
export type UpdateWorkInput      = z.infer<typeof updateWorkSchema>;
export type AddContributorInput  = z.infer<typeof addContributorSchema>;
export type SetOwnershipInput    = z.infer<typeof setOwnershipSchema>;
export type CreateContractInput  = z.infer<typeof createContractSchema>;
export type CreateClaimInput     = z.infer<typeof createClaimSchema>;
export type WorkIdInput          = z.infer<typeof workIdSchema>;
export type CreatorWorksInput    = z.infer<typeof creatorWorksSchema>;
