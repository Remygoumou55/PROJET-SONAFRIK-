"use client";

import { memo } from "react";
import type { CreatorCareerOsState } from "@sonafrik/types";

interface NextObjectiveCardProps {
  careerOs: CreatorCareerOsState;
}

function formatProgress(current: number, target: number): string {
  if (target <= 1) return current >= target ? "1 / 1" : "0 / 1";
  return `${current.toLocaleString("fr-FR")} / ${target.toLocaleString("fr-FR")}`;
}

function NextObjectiveCardView({ careerOs }: NextObjectiveCardProps) {
  const mission = careerOs.currentMission;

  if (!mission) {
    return (
      <section className="dash-objective" aria-label="Votre prochain objectif">
        <div className="dash-objective__inner dash-objective__inner--complete">
          <span className="dash-objective__icon" aria-hidden="true">
            🏆
          </span>
          <div className="dash-objective__body">
            <p className="dash-objective__kicker">Votre prochain objectif</p>
            <p className="dash-objective__title">Parcours Career OS complété</p>
            <p className="dash-objective__why">{careerOs.motivationMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-objective" aria-label="Votre prochain objectif">
      <div className="dash-objective__inner">
        <span className="dash-objective__icon" aria-hidden="true">
          {mission.icon}
        </span>
        <div className="dash-objective__body">
          <p className="dash-objective__kicker">Votre prochain objectif</p>
          <p className="dash-objective__title">{mission.label}</p>
          <p className="dash-objective__why">{mission.whyImportant}</p>
          <p className="dash-objective__reward">Récompense : {mission.rewardBadge}</p>
        </div>
        <div className="dash-objective__aside">
          <p className="dash-objective__progress-label">Progression</p>
          <p className="dash-objective__progress-value">
            {formatProgress(mission.current, mission.target)}
          </p>
          <div
            className="dash-objective__track"
            role="progressbar"
            aria-valuenow={mission.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="dash-objective__fill"
              style={{ width: `${mission.progressPercent}%` }}
            />
          </div>
          <a href="#creator-quick-actions" className="dash-objective__cta">
            Voir dans les actions rapides →
          </a>
        </div>
      </div>
    </section>
  );
}

export const NextObjectiveCard = memo(NextObjectiveCardView);
