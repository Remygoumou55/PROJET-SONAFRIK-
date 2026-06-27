"use client";

import { memo } from "react";
import type { CreatorCareerMission } from "@sonafrik/types";

interface CareerProgressProps {
  missions: CreatorCareerMission[];
}

function CareerProgressView({ missions }: CareerProgressProps) {
  return (
    <div className="career-os__timeline" aria-label="Étapes du parcours Career OS">
      <p className="career-os__timeline-label">Votre parcours</p>
      <ol className="career-os__timeline-list">
        {missions.map((mission) => (
          <li
            key={mission.id}
            className={`career-os__timeline-step${mission.completed ? " career-os__timeline-step--done" : ""}${!mission.completed && missions.find((m) => !m.completed)?.id === mission.id ? " career-os__timeline-step--current" : ""}`}
            title={mission.label}
          >
            <span className="career-os__timeline-dot" aria-hidden="true">
              {mission.completed ? "✓" : mission.icon}
            </span>
            <span className="career-os__timeline-name">{mission.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const CareerProgress = memo(CareerProgressView);
