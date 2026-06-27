"use client";

import Link from "next/link";
import { memo } from "react";
import type { CreatorCareerMission } from "@sonafrik/types";

interface CareerMissionProps {
  mission: CreatorCareerMission;
}

function formatProgress(current: number, target: number): string {
  if (target <= 1) {
    return current >= target ? "1 / 1" : "0 / 1";
  }
  return `${current.toLocaleString("fr-FR")} / ${target.toLocaleString("fr-FR")}`;
}

function CareerMissionView({ mission }: CareerMissionProps) {
  return (
    <article className="career-os__mission" aria-labelledby="career-os-mission-title">
      <p className="career-os__mission-kicker">🎯 Votre prochain objectif</p>
      <h3 id="career-os-mission-title" className="career-os__mission-title">
        <span className="career-os__mission-icon" aria-hidden="true">
          {mission.icon}
        </span>
        {mission.label}
      </h3>
      <div className="career-os__mission-why">
        <p className="career-os__mission-why-label">Pourquoi ?</p>
        <p className="career-os__mission-why-text">{mission.whyImportant}</p>
      </div>
      <div className="career-os__mission-progress">
        <div className="career-os__mission-progress-header">
          <span>Progression</span>
          <strong>{formatProgress(mission.current, mission.target)}</strong>
        </div>
        <div
          className="career-os__mission-track"
          role="progressbar"
          aria-valuenow={mission.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression : ${mission.progressPercent} pourcent`}
        >
          <div
            className="career-os__mission-fill"
            style={{ width: `${mission.progressPercent}%` }}
          />
        </div>
      </div>
      <Link href={mission.href} className="career-os__mission-cta">
        {mission.actionLabel}
      </Link>
    </article>
  );
}

export const CareerMission = memo(CareerMissionView);
