"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  initialCount: number;
  userId: string;
}

export function NotificationBell({ initialCount, userId }: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`notif_bell_${userId}`)
      .on(
        "postgres_changes" as "system",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        } as Parameters<ReturnType<typeof supabase.channel>["on"]>[1],
        () => { setCount((prev) => prev + 1); },
      )
      .on(
        "postgres_changes" as "system",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        } as Parameters<ReturnType<typeof supabase.channel>["on"]>[1],
        () => {
          // Refetch depuis le serveur pour éviter la dérive en multi-onglet
          void supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .is("read_at", null)
            .then(({ count }) => {
              if (count !== null) setCount(count);
            });
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
      style={{ color: "#A0A0A0" }}
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
          style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
