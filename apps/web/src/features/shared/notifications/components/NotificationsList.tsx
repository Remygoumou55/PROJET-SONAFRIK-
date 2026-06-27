"use client";

import { useCallback, useState } from "react";
import type { Notification, NotificationType } from "@sonafrik/types";
import { NOTIFICATION_TYPE_LABELS } from "@sonafrik/types";
import { formatDateTime } from "@/lib/formatters";
import { useNotificationsService } from "../hooks/useNotificationsService";

const TYPE_STYLE: Record<NotificationType, { bg: string; text: string }> = {
  stream_milestone:     { bg: "rgba(59,130,246,0.13)",  text: "var(--color-accent-bleu-clair)" },
  royalty_paid:         { bg: "rgba(255,194,14,0.13)",  text: "var(--color-or-solaire)" },
  verification_updated: { bg: "rgba(0,210,106,0.13)",   text: "var(--color-vert-energie)" },
  rights_claim_updated: { bg: "rgba(245,158,11,0.13)",  text: "var(--color-avertissement)" },
  system:               { bg: "rgba(85,85,85,0.13)",    text: "var(--color-texte-secondaire)" },
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
        const style = TYPE_STYLE[notif.type] ?? TYPE_STYLE.system;
        const isUnread = notif.read_at === null;

        return (
          <button
            key={notif.id}
            onClick={() => { if (isUnread) void markRead(notif.id); }}
            className="w-full text-left rounded-xl p-4 transition-opacity"
            style={{
              backgroundColor: isUnread ? "var(--color-card)" : "var(--color-surface)",
              border: `1px solid ${isUnread ? "var(--color-elevated)" : "var(--color-surface)"}`,
              cursor: isUnread ? "pointer" : "default",
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
                <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                  {notif.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
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
