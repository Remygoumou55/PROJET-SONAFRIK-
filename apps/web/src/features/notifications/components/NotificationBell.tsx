"use client";

import Link from "next/link";
import { useState } from "react";
import { useNotificationsService } from "../hooks/useNotificationsService";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

interface Props {
  initialCount: number;
  userId: string;
}

export function NotificationBell({ initialCount, userId }: Props) {
  const [count, setCount] = useState(initialCount);
  const notifications = useNotificationsService();

  useRealtimeChannel(
    `notif_bell_${userId}`,
    [
      {
        event: "INSERT",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
        onEvent: () => setCount((prev) => prev + 1),
      },
      {
        event: "UPDATE",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
        onEvent: () => {
          void notifications.countUnread(userId).then((c) => setCount(c));
        },
      },
    ],
    !!userId,
  );

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
      style={{ color: "var(--color-texte-secondaire)" }}
      aria-label={count > 0 ? `${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}` : "Notifications"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 rounded-full text-[9px] font-bold px-1 leading-none"
          style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
