"use client";

import { memo } from "react";
import { NotificationBell } from "@/features/shared/notifications/components/NotificationBell";

interface CreatorHeaderUtilitiesProps {
  userId: string;
  initialUnreadCount: number;
}

function CreatorHeaderUtilitiesView({
  userId,
  initialUnreadCount,
}: CreatorHeaderUtilitiesProps) {
  return (
    <div className="creator-header-utils">
      <NotificationBell initialCount={initialUnreadCount} userId={userId} />
    </div>
  );
}

export const CreatorHeaderUtilities = memo(CreatorHeaderUtilitiesView);
