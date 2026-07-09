"use client";

import { useCallback, useEffect, useState } from "react";
import type { Notification } from "@sonafrik/types";
import { NOTIFICATION_TYPE_LABELS } from "@sonafrik/types";
import { formatDateTime } from "@/lib/formatters";
import { useNotificationsService } from "../hooks/useNotificationsService";
import {
  publishNotificationLdseEvent,
} from "@/features/shared/ldse/notifications/useNotificationsLdseCount";
import { NOTIFICATIONS_LDSE_EVENTS } from "@/features/shared/ldse/notifications/notifications-ldse-config";

import { NOTIFICATION_TYPE_STYLES } from "@/lib/design/overlayTokens";

interface Props {
  initialNotifications: Notification[];
  userId: string;
}

export function NotificationsList({ initialNotifications, userId }: Props) {
  const service = useNotificationsService();
  const [items, setItems] = useState<Notification[]>(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    setItems(initialNotifications);
  }, [initialNotifications]);

  const unreadCount = items.filter((n) => n.read_at === null).length;

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      await service.markRead({ notificationId: id }).catch(() => {});
      publishNotificationLdseEvent(NOTIFICATIONS_LDSE_EVENTS.read, userId, { notificationId: id });
    },
    [service, userId],
  );

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    await service.markAllRead(userId).catch(() => {});
    publishNotificationLdseEvent(NOTIFICATIONS_LDSE_EVENTS.readAll, userId);
    setMarkingAll(false);
  }, [service, userId]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl mb-3">🔔</p>
        <p className="font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          Aucune notification
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
          Vous serez notifié ici des activités importantes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header avec "Tout marquer comme lu" */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
          <button
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className="text-xs font-medium transition-opacity disabled:opacity-40"
            style={{ color: "var(--color-vert-energie)" }}
          >
            {markingAll ? "…" : "Tout marquer comme lu"}
          </button>
        </div>
      )}

      {items.map((notif) => {
        const style = NOTIFICATION_TYPE_STYLES[notif.type] ?? NOTIFICATION_TYPE_STYLES.system;
        const isUnread = notif.read_at === null;
        const actionUrl = typeof notif.data?.action_url === "string" ? notif.data.action_url : null;
        const actionLabel = typeof notif.data?.action_label === "string" ? notif.data.action_label : null;

        return (
          <div
            key={notif.id}
            className="w-full text-left rounded-xl p-4 transition-opacity"
            style={{
              backgroundColor: isUnread ? "var(--color-card)" : "var(--color-surface)",
              border: `1px solid ${isUnread ? "var(--color-elevated)" : "var(--color-surface)"}`,
            }}
          >
            <div className="flex items-start gap-3">
              {/* Dot non-lue */}
              <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{
                backgroundColor: isUnread ? "var(--color-vert-energie)" : "transparent",
              }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {NOTIFICATION_TYPE_LABELS[notif.type]}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-texte-desactive)" }}>
                    {formatDateTime(notif.created_at)}
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => { if (isUnread) void markRead(notif.id); }}
                  style={{ cursor: isUnread ? "pointer" : "default" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                    {notif.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                    {notif.body}
                  </p>
                </button>
                {actionUrl && actionLabel ? (
                  <a
                    href={actionUrl}
                    className="mt-2 inline-flex rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: "var(--overlay-or-25)",
                      backgroundColor: "var(--overlay-or-05)",
                      color: "var(--color-texte-principal)",
                    }}
                    onClick={() => { if (isUnread) void markRead(notif.id); }}
                  >
                    {actionLabel}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
