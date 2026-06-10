"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent } from "@sonafrik/ui";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type Notification,
} from "@sonafrik/types";
import { useIdentityService } from "../hooks/useIdentity";

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications: initial }: NotificationListProps) {
  const router = useRouter();
  const identity = useIdentityService();
  const [notifications, setNotifications] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function markRead(id: string) {
    setLoading(id);
    try {
      await identity.markNotificationRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
        ),
      );
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function markAllRead() {
    setLoading("all");
    try {
      await identity.markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })),
      );
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (!notifications.length) {
    return (
      <Card>
        <CardContent className="text-texte-secondaire py-12 text-center text-sm">
          Aucune notification pour le moment.
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 ? (
        <Button variant="outline" size="sm" disabled={loading === "all"} onClick={markAllRead}>
          Tout marquer comme lu ({unreadCount})
        </Button>
      ) : null}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={notification.read_at ? "opacity-70" : "border-vert-energie/30"}
          >
            <CardContent className="space-y-2 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {NOTIFICATION_CATEGORY_LABELS[notification.category]}
                </Badge>
                {!notification.read_at ? <Badge variant="primary">Non lue</Badge> : null}
                <span className="text-texte-desactive ml-auto text-xs">
                  {formatRelative(notification.created_at)}
                </span>
              </div>
              <p className="text-texte-principal font-medium">{notification.title}</p>
              <p className="text-texte-secondaire text-sm">{notification.body}</p>
              {!notification.read_at ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading === notification.id}
                  onClick={() => markRead(notification.id)}
                >
                  Marquer comme lue
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
