import type {
  CreatorCareerMission,
  CreatorCareerOsState,
} from "@sonafrik/types";
import type { BuildDashboardInput } from "../creatorDashboard.presentation.shared";
import {
  buildCareerEngineContext,
  CAREER_MISSION_DEFINITIONS,
  resolveMissionHref,
} from "./career.missions";
import { resolveCareerLevels, resolveCurrentLevel } from "./career.levels";

function buildMotivationMessage(
  current: CreatorCareerMission | null,
  completedCount: number,
  total: number,
): { message: string; tone: CreatorCareerOsState["encouragementTone"] } {
  if (!current) {
    return {
      message: "Bravo ! Vous avez parcouru toutes les étapes du parcours. Continuez à créer — SONAFRIK vous accompagne.",
      tone: "celebrate",
    };
  }

  if (current.completed) {
    return {
      message: "Mission accomplie — la prochaine étape vous attend déjà.",
      tone: "celebrate",
    };
  }

  const remaining = current.target - current.current;

  if (current.progressPercent >= 75 && remaining > 0) {
    if (current.id === "reach_100_listens" || current.id === "reach_1000_listens") {
      return {
        message: `Encore ${remaining.toLocaleString("fr-FR")} écoutes avant votre prochain objectif.`,
        tone: "almost",
      };
    }
    if (current.id === "grow_community") {
      return {
        message: `Plus que ${remaining} fans engagés pour développer votre communauté.`,
        tone: "almost",
      };
    }
    return {
      message: `Vous y êtes presque — encore ${remaining} pour valider cette étape.`,
      tone: "almost",
    };
  }

  if (completedCount === 0) {
    return {
      message: "Bienvenue sur SONAFRIK — votre mentor musical est prêt à vous guider.",
      tone: "launch",
    };
  }

  if (current.id === "publish_first_track") {
    return {
      message: "Vous êtes à une étape de publier votre premier morceau.",
      tone: "progress",
    };
  }

  const ratio = completedCount / total;
  if (ratio >= 0.5) {
    return {
      message: `Déjà ${completedCount} étapes validées — vous avancez remarquablement bien.`,
      tone: "mentor",
    };
  }

  return {
    message: "Chaque petite action compte. SONAFRIK vous montre exactement quoi faire ensuite.",
    tone: "progress",
  };
}

/** Career Engine — calcule missions, niveau et guidance dynamique */
export function buildCareerOs(input: BuildDashboardInput): CreatorCareerOsState {
  const ctx = buildCareerEngineContext(input);

  const missions: CreatorCareerMission[] = CAREER_MISSION_DEFINITIONS.map((def) => {
    const progress = def.evaluate(ctx);
    return {
      id: def.id,
      label: def.label,
      whyImportant: def.whyImportant,
      icon: def.icon,
      href: resolveMissionHref(def, ctx),
      actionLabel: def.actionLabel,
      rewardBadge: def.rewardBadge,
      completed: progress.completed,
      current: progress.current,
      target: progress.target,
      progressPercent: progress.progressPercent,
    };
  });

  const completedMissionCount = missions.filter((m) => m.completed).length;
  const totalMissionCount = missions.length;
  const currentMission = missions.find((m) => !m.completed) ?? null;
  const overallProgressPercent = Math.round((completedMissionCount / totalMissionCount) * 100);

  const levels = resolveCareerLevels(ctx);
  const level = resolveCurrentLevel(levels);
  const { message: motivationMessage, tone: encouragementTone } = buildMotivationMessage(
    currentMission,
    completedMissionCount,
    totalMissionCount,
  );

  return {
    level,
    levels,
    currentMission,
    missions,
    completedMissionCount,
    totalMissionCount,
    overallProgressPercent,
    motivationMessage,
    encouragementTone,
  };
}
