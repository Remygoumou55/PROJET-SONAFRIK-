"use client";

import { useCallback, useState } from "react";
import type { Notification, NotificationType } from "@sonafrik/types";
import { NOTIFICATION_TYPE_LABELS } from "@sonafrik/types";
import { formatDateTime } from "@/lib/formatters";
import { useNotificationsService } from "../hooks/useNotificationsService";

const TYPE_STYLE: Record<NotificationType, { bg: string; text: string }> = {
  stream_milestone:     { bg: "#3B82F622", text: "#60A5FA" },
  royalty_paid:         { bg: "#FFC20E22", text: "#FFC20E" },
  verification_updated: { bg: "#00D26A22", text: "#00D26A" },
  rights_claim_updated: { bg: "#F59E0B22", text: "#F59E0B" },
  system:               { bg: "#55555522", text: "#888888" },
};

interface Props {
  initialNotifications: Notification[];
  userId: string;
}

export function NotificationsList({ initialNotifications, userId }: Props) {
  const service = useNotificationsService();
  const [items, setItems] = useState<Notification[]>(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = items.filter((n) => n.read_at === null).length;

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      await service.markRead({ notificationId: id }).catch(() => {});
    },
    [service],
  );

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    await service.markAllRead(userId).catch(() => {});
    setMarkingAll(false);
  }, [service, userId]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl mb-3">🔔</p>
        <p className="font-semibold" style={{ color: "#FFFFFF" }}>
          Aucune notification
        </p>
        <p className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
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
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
          <button
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className="text-xs font-medium transition-opacity disabled:opacity-40"
            style={{ color: "#00D26A" }}
          >
            {markingAll ? "…" : "Tout marquer comme lu"}
          </button>
        </div>
      )}

      {items.map((notif) => {
        const style = TYPE_STYLE[notif.type] ?? TYPE_STYLE.system;
        const isUnread = notif.read_at === null;

        return (
          <button
            key={notif.id}
            onClick={() => { if (isUnread) void markRead(notif.id); }}
            className="w-full text-left rounded-xl p-4 transition-opacity"
            style={{
              backgroundColor: isUnread ? "#1F1F1F" : "#181818",
              border: `1px solid ${isUnread ? "#2A2A2A" : "#222222"}`,
              cursor: isUnread ? "pointer" : "default",
            }}
          >
            <div className="flex items-start gap-3">
              {/* Dot non-lue */}
              <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{
                backgroundColor: isUnread ? "#00D26A" : "transparent",
              }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {NOTIFICATION_TYPE_LABELS[notif.type]}
                  </span>
                  <span className="text-[10px]" style={{ color: "#555555" }}>
                    {formatDateTime(notif.created_at)}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  {notif.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#A0A0A0" }}>
                  {notif.body}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
