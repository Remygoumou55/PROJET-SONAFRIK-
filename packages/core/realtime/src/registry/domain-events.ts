import { z } from "zod";

const basePayload = z.record(z.unknown()).optional().default({});

/** Nomenclature officielle SONAFRIK — domaine.entité.action */
export const SRTSP_DOMAIN_EVENTS = {
  // Catalog / Publication
  TRACK_CREATED: "catalog.track.created",
  TRACK_UPDATED: "catalog.track.updated",
  TRACK_DELETED: "catalog.track.deleted",
  TRACK_PUBLISHED: "catalog.track.published",
  PUBLICATION_SUBMITTED: "publication.submitted",
  PUBLICATION_APPROVED: "publication.approved",
  PUBLICATION_REJECTED: "publication.rejected",
  PUBLICATION_DRAFT_CREATED: "publication.draft.created",
  PUBLICATION_DRAFT_UPDATED: "publication.draft.updated",
  PUBLICATION_AUDIO_UPLOADED: "publication.audio.uploaded",
  PUBLICATION_COVER_UPLOADED: "publication.cover.uploaded",
  PUBLICATION_METADATA_COMPLETED: "publication.metadata.completed",
  PUBLICATION_CANCELLED: "publication.cancelled",
  PUBLICATION_DELETED: "publication.deleted",
  ALBUM_PUBLISHED: "catalog.album.published",
  CATALOG_INVALIDATE: "catalog.invalidate",

  // Creator
  ARTIST_UPDATED: "creator.artist.updated",
  ANALYTICS_INVALIDATE: "creator.analytics.invalidate",

  // Wallet / Royalties
  WALLET_UPDATED: "wallet.balance.updated",
  ROYALTY_GENERATED: "wallet.royalty.generated",
  WITHDRAWAL_UPDATED: "wallet.withdrawal.updated",

  // Streaming
  STREAMING_STARTED: "streaming.session.started",
  STREAMING_PAUSED: "streaming.session.paused",
  STREAMING_ENDED: "streaming.session.ended",

  // Notifications
  NOTIFICATION_CREATED: "notifications.item.created",

  // Listener / Social
  FAVORITE_TOGGLED: "listener.favorite.toggled",
  PLAYLIST_UPDATED: "listener.playlist.updated",
  FOLLOW_TOGGLED: "social.follow.toggled",
  TRACK_REACTION_UPDATED: "listener.track.reaction.updated",
  LISTENER_LIVE_UPDATED: "listener.track.live.updated",

  // Admin
  ADMIN_SNAPSHOT_INVALIDATE: "admin.snapshot.invalidate",

  // System
  SYSTEM_HEARTBEAT: "system.heartbeat",
} as const;

export type SrtspDomainEventName = (typeof SRTSP_DOMAIN_EVENTS)[keyof typeof SRTSP_DOMAIN_EVENTS];

export const trackPayloadSchema = z.object({
  trackId: z.string().uuid(),
  creatorId: z.string().uuid().optional(),
});

/** Payload officiel Publication Wizard — Phase 3.1. */
export const publicationWizardPayloadSchema = z.object({
  albumId: z.string().uuid(),
  trackId: z.string().uuid(),
  creatorId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
});

export const creatorPayloadSchema = z.object({
  creatorId: z.string().uuid(),
});

export const walletPayloadSchema = z.object({
  userId: z.string().uuid(),
  walletId: z.string().uuid().optional(),
});

export const streamingPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  trackId: z.string().uuid().optional(),
});

export const notificationPayloadSchema = z.object({
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
});

/** Compatibilité LDSE — mapping événements legacy → SRTSP officiels. */
export const LDSE_TO_SRTSP_EVENT_MAP: Record<string, SrtspDomainEventName> = {
  "creator.track.published": SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
  "creator.track.updated": SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  "creator.album.published": SRTSP_DOMAIN_EVENTS.ALBUM_PUBLISHED,
  "creator.catalog.invalidate": SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
  "creator.analytics.invalidate": SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
  "wallet.invalidate": SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
  "listener.library.invalidate": SRTSP_DOMAIN_EVENTS.PLAYLIST_UPDATED,
  "admin.snapshot.invalidate": SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE,
};

export const DOMAIN_EVENT_DEFINITIONS = [
  {
    name: SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
    version: 1,
    source: "catalog" as const,
    destinations: ["catalog", "publications", "dashboard"] as const,
    schema: trackPayloadSchema,
    description: "Nouveau morceau créé dans le catalogue créateur",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
    version: 1,
    source: "catalog" as const,
    destinations: ["catalog", "publications", "dashboard"] as const,
    schema: trackPayloadSchema,
    description: "Morceau modifié",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
    version: 1,
    source: "catalog" as const,
    destinations: ["catalog", "publications", "dashboard"] as const,
    schema: trackPayloadSchema,
    description: "Morceau supprimé",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
    version: 1,
    source: "publication" as const,
    destinations: ["catalog", "publications", "dashboard", "library"] as const,
    schema: trackPayloadSchema,
    description: "Morceau publié sur SONAFRIK",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "admin", "dashboard"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Publication soumise en revue",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Brouillon publication créé (étape 1 wizard)",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Brouillon publication mis à jour",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Audio uploadé via wizard",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Pochette uploadée ou générée via wizard",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Métadonnées wizard enregistrées",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Publication wizard abandonnée",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog"] as const,
    schema: publicationWizardPayloadSchema,
    description: "Publication supprimée (hors wizard courant)",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "catalog", "dashboard"] as const,
    schema: trackPayloadSchema,
    description: "Publication validée par SONAFRIK",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
    version: 1,
    source: "publication" as const,
    destinations: ["publications", "dashboard"] as const,
    schema: trackPayloadSchema.extend({ reason: z.string().optional() }),
    description: "Publication rejetée",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
    version: 1,
    source: "wallet" as const,
    destinations: ["wallet", "dashboard"] as const,
    schema: walletPayloadSchema,
    description: "Solde ou état wallet modifié",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
    version: 1,
    source: "wallet" as const,
    destinations: ["wallet", "dashboard", "analytics"] as const,
    schema: walletPayloadSchema,
    description: "Royalties calculées",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.STREAMING_STARTED,
    version: 1,
    source: "streaming" as const,
    destinations: ["streaming", "analytics"] as const,
    schema: streamingPayloadSchema,
    description: "Session streaming démarrée",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED,
    version: 1,
    source: "notifications" as const,
    destinations: ["notifications", "*"] as const,
    schema: notificationPayloadSchema,
    description: "Nouvelle notification",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
    type: "control" as const,
    version: 1,
    source: "catalog" as const,
    destinations: ["catalog", "publications", "dashboard"] as const,
    schema: creatorPayloadSchema,
    description: "Invalidation cache catalogue créateur",
  },
  {
    name: SRTSP_DOMAIN_EVENTS.SYSTEM_HEARTBEAT,
    type: "heartbeat" as const,
    version: 1,
    source: "system" as const,
    destinations: ["*"] as const,
    schema: basePayload,
    description: "Heartbeat transport — observabilité",
  },
] as const;
