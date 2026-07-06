"use client";

import type { Notification } from "@sonafrik/types";
import { NotificationsList } from "./NotificationsList";
import { useNotificationsSrtspLive } from "../hooks/useNotificationsSrtspLive";

/** Liste notifications avec refresh SRTSP — utilisée par settings et /notifications. */
export function NotificationsLiveList({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: Notification[];
}) {
  const { data: liveNotifications } = useNotificationsSrtspLive({
    userId,
    initialData: initialNotifications,
  });

  return (
    <NotificationsList
      initialNotifications={liveNotifications ?? initialNotifications}
      userId={userId}
    />
  );
}
