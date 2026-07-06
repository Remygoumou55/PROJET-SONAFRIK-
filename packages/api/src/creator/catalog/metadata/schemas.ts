import { z } from "zod";

/** Entrées utilisateur autorisées à l'étape 3 du Publication Wizard. */
export const wizardUserMetadataSchema = z.object({
  trackId: z.string().uuid(),
  genreId: z.string().uuid(),
  language: z.string().trim().min(2).max(5),
  /** Paroles brutes (facultatif) — stockées en brouillon wizard. */
  lyrics: z.string().trim().max(12000).optional(),
  /** Contenu explicite — facultatif, false par défaut via MAE. */
  explicit: z.boolean().optional(),
});

export type WizardUserMetadataInput = z.infer<typeof wizardUserMetadataSchema>;
