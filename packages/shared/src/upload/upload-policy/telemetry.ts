/**
 * SONAFRIK — Upload Policy Enterprise
 * Types de télémétrie pour les uploads.
 *
 * Ces types définissent la structure des données de métriques collectables
 * pendant un upload. Aucune connexion à un service tiers en Phase 1.1.
 * L'intégration (Posthog, Sentry, custom) se fera en Phase 3+.
 */

/** Données de télémétrie collectées lors d'un upload */
export interface UploadTelemetryData {
  /** Durée totale de l'upload en millisecondes */
  readonly uploadDuration?: number;
  /** Taille du fichier en octets */
  readonly uploadSize?: number;
  /** MIME type brut rapporté par le navigateur (peut être vide) */
  readonly browserMime?: string;
  /** MIME type résolu après normalisation et fallback extension */
  readonly resolvedMime?: string;
  /** Navigateur (extrait de navigator.userAgent) */
  readonly browser?: string;
  /** Plateforme (navigator.platform) */
  readonly platform?: string;
  /** Type de device inféré */
  readonly device?: "desktop" | "mobile" | "tablet" | "unknown";
  /** Nombre de tentatives (1 = premier essai, >1 = retry) */
  readonly retryCount?: number;
  /** Version de la politique utilisée */
  readonly policyVersion?: string;
  /** Contexte métier de l'upload (valeur de UploadContext) */
  readonly context?: string;
  /** Résultat final de l'upload */
  readonly outcome?: "success" | "failure" | "cancelled";
  /** Code d'erreur si outcome = "failure" (valeur de UploadErrorCode) */
  readonly errorCode?: string;
}

/** Données de performance réseau collectées pendant l'upload */
export interface UploadNetworkMetrics {
  /** Débit moyen en octets/seconde */
  readonly throughputBps?: number;
  /** Latence initiale de connexion en millisecondes */
  readonly connectionLatencyMs?: number;
  /** Nombre de chunks envoyés (si upload multipart) */
  readonly chunkCount?: number;
}

/** Données de télémétrie complètes (données + métriques réseau) */
export interface UploadTelemetryPayload {
  readonly data: UploadTelemetryData;
  readonly network?: UploadNetworkMetrics;
  readonly timestamp: number;
  readonly sessionId?: string;
}
