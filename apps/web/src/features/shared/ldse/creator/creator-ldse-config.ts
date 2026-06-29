/** Clés cache LDSE — domaine creator (scaffold v1). */
export const CREATOR_LDSE_KEYS = {
  catalogSummary: (creatorId: string) => `creator:${creatorId}:catalog-summary`,
  analyticsKpis: (creatorId: string) => `creator:${creatorId}:analytics-kpis`,
  tracksList: (creatorId: string) => `creator:${creatorId}:tracks-list`,
  albumsList: (creatorId: string) => `creator:${creatorId}:albums-list`,
} as const;

/** Événements métier creator — Event Bus LDSE */
export const CREATOR_LDSE_EVENTS = {
  trackPublished: "creator.track.published",
  trackUpdated: "creator.track.updated",
  albumPublished: "creator.album.published",
  catalogInvalidate: "creator.catalog.invalidate",
  analyticsInvalidate: "creator.analytics.invalidate",
} as const;
