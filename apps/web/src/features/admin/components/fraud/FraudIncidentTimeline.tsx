"use client";

import { memo, useMemo } from "react";
import type { AdminFraudStreamEvent } from "@sonafrik/api/admin";
import { formatDateTime } from "@/lib/formatters";
import {
  buildIncidentDecisionAid,
  buildIncidentHeadline,
  humanizeStreamEventType,
} from "../../lib/fraud/humanizeFraudIncident";

interface Props {
  events: AdminFraudStreamEvent[];
  startedAt: string;
  flags: string[];
  isValidListen: boolean;
}

function FraudIncidentTimelineView({ events, startedAt, flags, isValidListen }: Props) {
  const conclusion = useMemo(
    () => buildIncidentHeadline(flags, isValidListen),
    [flags, isValidListen],
  );
  const decision = useMemo(
    () => buildIncidentDecisionAid(flags, isValidListen, 0),
    [flags, isValidListen],
  );

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
            label: "Lecture démarrée",
            emoji: "▶️",
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
      <li className="fraud-timeline__item fraud-timeline__item--analysis">
        <div className="fraud-timeline__dot fraud-timeline__dot--analysis" aria-hidden />
        <div className="fraud-timeline__content">
          <p className="fraud-timeline__label">🔍 Analyse automatique</p>
          <p className="fraud-timeline__sub">{decision.analysis}</p>
        </div>
      </li>
      <li className="fraud-timeline__item fraud-timeline__item--conclusion">
        <div className="fraud-timeline__dot fraud-timeline__dot--conclusion" aria-hidden />
        <div className="fraud-timeline__content">
          <p className="fraud-timeline__label">
            {conclusion.emoji} Conclusion — {conclusion.title}
          </p>
          <p className="fraud-timeline__sub">{decision.recommendedAction}</p>
        </div>
      </li>
    </ol>
  );
}

export const FraudIncidentTimeline = memo(FraudIncidentTimelineView);
