"use client";

import { memo } from "react";
import type { AdminFraudStreamEvent } from "@sonafrik/api/admin";
import { formatDateTime } from "@/lib/formatters";
import { humanizeStreamEventType } from "../../lib/fraud/humanizeFraudIncident";

interface Props {
  events: AdminFraudStreamEvent[];
  startedAt: string;
}

function FraudIncidentTimelineView({ events, startedAt }: Props) {
  const items =
    events.length > 0
      ? events.map((e) => ({
          id: e.id,
          time: e.created_at,
          ...humanizeStreamEventType(e.event_type),
        }))
      : [
          {
            id: "start",
            time: startedAt,
            label: "Nouvelle écoute",
            emoji: "🟢",
          },
        ];

  return (
    <ol className="fraud-timeline" aria-label="Chronologie de la session">
      {items.map((item, index) => (
        <li key={item.id} className="fraud-timeline__item">
          <div className="fraud-timeline__dot" aria-hidden />
          <div className="fraud-timeline__content">
            <time className="fraud-timeline__time" dateTime={item.time}>
              {formatDateTime(item.time).split(" ")[1] ?? formatDateTime(item.time)}
            </time>
            <p className="fraud-timeline__label">
              {item.emoji} {item.label}
            </p>
          </div>
          {index < items.length - 1 ? <span className="fraud-timeline__connector" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  );
}

export const FraudIncidentTimeline = memo(FraudIncidentTimelineView);
