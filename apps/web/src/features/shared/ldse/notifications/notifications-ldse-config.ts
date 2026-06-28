/** Clés cache LDSE — notifications utilisateur */
export const NOTIFICATIONS_LDSE_KEYS = {
  unreadCount: (userId: string) => `notifications:unread:${userId}`,
} as const;

export const NOTIFICATIONS_LDSE_EVENTS = {
  created: "notification.created",
  read: "notification.read",
  readAll: "notification.read_all",
  updated: "notification.updated",
} as const;
