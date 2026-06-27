"use client";

import { memo } from "react";
import type { CreatorCareerOsState } from "@sonafrik/types";
import { CareerLevel } from "./CareerLevel";
import { CareerMission } from "./CareerMission";
import { CareerProgress } from "./CareerProgress";
import { CareerNotification } from "./CareerNotification";
import { CareerReward } from "./CareerReward";

interface CareerOsCardProps {
  careerOs: CreatorCareerOsState;
}

function CareerOsCardView({ careerOs }: CareerOsCardProps) {
  const lastCompleted = [...careerOs.missions].reverse().find((m) => m.completed);

  return (
    <section className="creator-widget career-os" aria-label="Coach de carrière SONAFRIK">
      <header className="career-os__header">
        <h2 className="creator-widget__title">Coach de carrière SONAFRIK</h2>
        <span className="career-os__brand">Career OS</span>
      </header>

      <CareerReward
        levelId={careerOs.level.id}
        missionId={careerOs.currentMission?.id ?? null}
        rewardBadge={lastCompleted?.rewardBadge ?? null}
      />

      <CareerLevel level={careerOs.level} overallProgressPercent={careerOs.overallProgressPercent} />

      <CareerNotification
        message={careerOs.motivationMessage}
        tone={careerOs.encouragementTone}
      />

      {careerOs.currentMission ? (
        <CareerMission mission={careerOs.currentMission} />
      ) : (
        <article className="career-os__mission career-os__mission--complete">
          <p className="career-os__mission-kicker">🎯 Parcours complété</p>
          <p className="career-os__mission-title">Vous avez validé toutes les étapes Career OS.</p>
          <p className="career-os__mission-why-text">
            Continuez à publier, partager et animer votre communauté — SONAFRIK reste à vos côtés.
          </p>
        </article>
      )}

      <CareerProgress missions={careerOs.missions} />
    </section>
  );
}

export const CareerOsCard = memo(CareerOsCardView);
