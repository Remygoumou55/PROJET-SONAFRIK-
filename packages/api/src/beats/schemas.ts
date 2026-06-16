import { z } from "zod";

export const createBeatSchema = z.object({
  title:       z.string().min(1).max(200),
  priceGnf:    z.number().int().min(0),
  description: z.string().max(1000).optional(),
  bpm:         z.number().int().min(40).max(300).optional(),
  key:         z.string().max(10).optional(),
  genre:       z.string().max(100).optional(),
  licenseType: z.enum(["non_exclusive", "exclusive", "free"]).default("non_exclusive"),
});

export type CreateBeatInput = z.infer<typeof createBeatSchema>;
