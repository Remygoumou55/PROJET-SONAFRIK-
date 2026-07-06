import type { TrackCreditItem } from "../schemas";
import type { UpdateAlbumInput, UpdateTrackInput } from "../schemas";
import type { WizardUserMetadataInput } from "./schemas";

/** Contexte artiste requis pour générer les métadonnées automatiques. */
export interface MetadataAutomaticContext {
  creatorId: string;
  userId: string;
  stageName: string;
  validatedAt: Date;
}

/** Patch track — étape 3 (entrées utilisateur + défauts système, sans crédits ni date publication). */
export interface WizardAutomaticTrackPatch {
  trackUpdate: Pick<UpdateTrackInput, "language" | "explicit" | "genreIds">;
}

/** Patch album — validation publication (date réelle de soumission). */
export interface PublicationAutomaticAlbumPatch {
  albumUpdate: Pick<UpdateAlbumInput, "releaseDate">;
  releaseDateIso: string;
  publishedAtIso: string;
}

/**
 * Metadata Automatic Engine (MAE) — SONAFRIK
 *
 * Centralise toutes les métadonnées déterminables sans intervention utilisateur.
 * Extensible : ISRC, UPC, BPM, fingerprint, classification IA (post-MVP).
 */
export class MetadataAutomaticEngine {
  constructor(private readonly context: MetadataAutomaticContext) {}

  /** Étape 3 — l'utilisateur ne fournit que genre + langue. */
  buildWizardTrackPatch(input: WizardUserMetadataInput): WizardAutomaticTrackPatch {
    return {
      trackUpdate: {
        language: input.language.length >= 2 ? input.language.slice(0, 2) : input.language,
        explicit: false,
        genreIds: [input.genreId],
      },
    };
  }

  /** Crédits par défaut — auteur, compositeur, producteur = artiste connecté. */
  buildAutomaticCredits(): TrackCreditItem[] {
    const name = this.context.stageName.trim() || "Artiste";
    return [
      { contributorName: name, role: "auteur", displayOrder: 0 },
      { contributorName: name, role: "compositeur", displayOrder: 1 },
      { contributorName: name, role: "producteur", displayOrder: 2 },
    ];
  }

  /**
   * Date de publication = date réelle de validation (pas « aujourd'hui » au remplissage).
   * Appelé uniquement lors de submitAlbum (Publier maintenant).
   */
  buildPublicationAlbumPatch(validatedAt: Date = this.context.validatedAt): PublicationAutomaticAlbumPatch {
    const releaseDateIso = validatedAt.toISOString().slice(0, 10);
    return {
      albumUpdate: { releaseDate: releaseDateIso },
      releaseDateIso,
      publishedAtIso: validatedAt.toISOString(),
    };
  }

  /** Horodatage création — timestamp système au moment de l'opération. */
  buildCreationTimestamp(validatedAt: Date = this.context.validatedAt): string {
    return validatedAt.toISOString();
  }

  /** Identifiants système — prêts pour extensions analytics / royalties. */
  buildSystemIdentity(): { creatorId: string; userId: string } {
    return {
      creatorId: this.context.creatorId,
      userId: this.context.userId,
    };
  }
}
