/**
 * Traduction métier des signaux anti-fraude — zéro jargon technique en UI admin.
 */

export type FraudSeverity = "info" | "attention" | "important" | "critical";

export interface HumanFraudFlag {
  /** Identifiant technique interne — jamais affiché */
  code: string;
  label: string;
  emoji: string;
  severity: FraudSeverity;
  sentence: string;
}

const FLAG_CATALOG: Record<string, Omit<HumanFraudFlag, "code">> = {
  orphaned_session: {
    label: "Écoute interrompue",
    emoji: "🟡",
    severity: "attention",
    sentence: "Cette session semble avoir été interrompue avant la fin.",
  },
  multi_session_start: {
    label: "Écoutes simultanées",
    emoji: "🔴",
    severity: "critical",
    sentence: "Plusieurs écoutes ont été lancées en même temps sur ce compte.",
  },
  fast_forward_detected: {
    label: "Activité inhabituelle",
    emoji: "🟠",
    severity: "important",
    sentence: "La progression de l'écoute avance plus vite que le temps réel.",
  },
  negative_position: {
    label: "Signal anormal",
    emoji: "🟠",
    severity: "important",
    sentence: "Un comportement de lecture incohérent a été détecté.",
  },
  seek_abuse: {
    label: "Sauts répétés",
    emoji: "🟠",
    severity: "important",
    sentence: "Des sauts dans le morceau ont été détectés de façon répétée.",
  },
  too_fast: {
    label: "Vitesse anormale",
    emoji: "🟠",
    severity: "important",
    sentence: "La vitesse d'écoute semble anormale pour une écoute humaine.",
  },
  repeated_start: {
    label: "Redémarrages répétés",
    emoji: "🟡",
    severity: "attention",
    sentence: "Ce morceau a été relancé plusieurs fois en peu de temps.",
  },
  duplicate_session: {
    label: "Session dupliquée",
    emoji: "🔴",
    severity: "critical",
    sentence: "Une écoute en double a été détectée sur la plateforme.",
  },
  bot_pattern: {
    label: "Suspicion de fraude",
    emoji: "🔴",
    severity: "critical",
    sentence: "Ce comportement ressemble à une écoute automatisée.",
  },
  velocity: {
    label: "Activité suspecte",
    emoji: "🟠",
    severity: "important",
    sentence: "Cette activité nécessite une vérification manuelle.",
  },
};

const SEVERITY_RANK: Record<FraudSeverity, number> = {
  info: 0,
  attention: 1,
  important: 2,
  critical: 3,
};

export function humanizeFraudFlag(code: string): HumanFraudFlag {
  const entry = FLAG_CATALOG[code];
  if (entry) return { code, ...entry };
  return {
    code,
    label: "Activité à vérifier",
    emoji: "🟡",
    severity: "attention",
    sentence: "Cette activité nécessite une vérification de notre équipe.",
  };
}

export function humanizeFraudFlags(flags: string[]): HumanFraudFlag[] {
  return flags.map(humanizeFraudFlag);
}

export function resolveIncidentSeverity(flags: string[]): FraudSeverity {
  if (flags.length === 0) return "info";
  const humanized = humanizeFraudFlags(flags);
  return humanized.reduce<FraudSeverity>(
    (max, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[max] ? f.severity : max),
    "info",
  );
}

export function buildIncidentHeadline(
  flags: string[],
  isValidListen: boolean,
): { title: string; summary: string; emoji: string; severity: FraudSeverity } {
  if (flags.length === 0) {
    if (isValidListen) {
      return {
        title: "Écoute validée",
        summary: "Cette écoute respecte les règles de la plateforme.",
        emoji: "🟢",
        severity: "info",
      };
    }
    return {
      title: "Écoute non comptabilisée",
      summary: "Cette session n'a pas été retenue comme écoute valide.",
      emoji: "🟡",
      severity: "attention",
    };
  }

  const primary = humanizeFraudFlags(flags).sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  )[0]!;

  return {
    title: primary.label,
    summary: primary.sentence,
    emoji: primary.emoji,
    severity: primary.severity,
  };
}

export function humanizeStreamEventType(eventType: string): { label: string; emoji: string } {
  const map: Record<string, { label: string; emoji: string }> = {
    play: { label: "Lecture démarrée", emoji: "▶️" },
    pause: { label: "Pause", emoji: "⏸️" },
    resume: { label: "Reprise", emoji: "▶️" },
    seek: { label: "Saut dans le morceau", emoji: "⏩" },
    complete: { label: "Morceau terminé", emoji: "🟢" },
    skip: { label: "Passage au suivant", emoji: "⏭️" },
    heartbeat: { label: "Signal de présence", emoji: "💚" },
  };
  return map[eventType] ?? { label: "Événement d'écoute", emoji: "•" };
}

export const SEVERITY_META: Record<
  FraudSeverity,
  { label: string; emoji: string; cssClass: string }
> = {
  info: { label: "Information", emoji: "ℹ️", cssClass: "fraud-severity--info" },
  attention: { label: "Attention", emoji: "🟡", cssClass: "fraud-severity--attention" },
  important: { label: "Important", emoji: "🟠", cssClass: "fraud-severity--important" },
  critical: { label: "Critique", emoji: "🔴", cssClass: "fraud-severity--critical" },
};
