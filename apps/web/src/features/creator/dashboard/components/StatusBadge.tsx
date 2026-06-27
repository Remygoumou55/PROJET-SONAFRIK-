"use client";

import { useEffect, useState } from "react";

interface StatusBadgeProps {
  lastUpdated?: Date;
}

function formatTimeAgo(lastUpdated: Date): string {
  const diffMs = Date.now() - lastUpdated.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "maintenant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.floor(diffMin / 60)} h`;
}

export function StatusBadge({ lastUpdated = new Date() }: StatusBadgeProps) {
  const [timeAgo, setTimeAgo] = useState(() => formatTimeAgo(lastUpdated));

  useEffect(() => {
    const update = () => setTimeAgo(formatTimeAgo(lastUpdated));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="status-badge" role="status" aria-live="polite">
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__text">En ligne · Mis à jour {timeAgo}</span>
    </div>
  );
}
