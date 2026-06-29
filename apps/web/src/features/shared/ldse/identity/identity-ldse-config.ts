/** Clés cache LDSE — identity / profil */
export const IDENTITY_LDSE_KEYS = {
  profileSummary: (userId: string) => `identity:${userId}:profile-summary`,
  sessions: (userId: string) => `identity:${userId}:sessions`,
} as const;

export const IDENTITY_LDSE_EVENTS = {
  profileUpdated: "identity.profile.updated",
  preferencesUpdated: "identity.preferences.updated",
  invalidate: "identity.invalidate",
} as const;
