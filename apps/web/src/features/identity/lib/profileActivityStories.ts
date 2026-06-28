import { formatDateWithTime, formatMonthYear } from "@/lib/formatters";
import type { ProfileActivitySummary } from "./profilePresentation";

/** États de parcours — extensible sans modifier les composants UI. */
export type ActivityJourneyState =
  | "new_user"
  | "first_track"
  | "first_listens"
  | "first_revenue"
  | "confirmed"
  | "listener";

export interface ActivityCardViewModel {
  id: string;
  icon: string;
  title: string;
  headline: string;
  message: string;
  journeyState: ActivityJourneyState;
  progress: number;
  ariaLabel: string;
}

const JOURNEY_STATE_LABELS: Record<ActivityJourneyState, string> = {
  new_user: "Nouvel utilisateur",
  first_track: "Premier morceau publié",
  first_listens: "Premières écoutes",
  first_revenue: "Premiers revenus",
  confirmed: "Parcours confirmé",
  listener: "Auditeur SONAFRIK",
};

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function resolveActivityJourneyState(
  activity: ProfileActivitySummary,
  isArtist: boolean,
): ActivityJourneyState {
  if (!isArtist) return "listener";

  const tracks = activity.publishedTracks ?? 0;
  if (tracks <= 0) return "new_user";
  if (tracks === 1) return "first_track";
  return "confirmed";
}

function buildMemberSinceCard(memberSince: string): ActivityCardViewModel {
  const monthYear = formatMonthYear(memberSince);
  return {
    id: "member_since",
    icon: "🌍",
    title: "Membre SONAFRIK",
    headline: `Membre SONAFRIK depuis ${monthYear}`,
    message: "Vous faites partie de notre bien commun musical.",
    journeyState: "confirmed",
    progress: 100,
    ariaLabel: `Membre SONAFRIK depuis ${monthYear}`,
  };
}

function buildLastConnectionCard(lastConnection: string | null): ActivityCardViewModel {
  if (!lastConnection) {
    return {
      id: "last_connection",
      icon: "✨",
      title: "Dernière visite",
      headline: "À très bientôt",
      message: "Votre prochaine visite relancera l'aventure musicale.",
      journeyState: "new_user",
      progress: 20,
      ariaLabel: "Dernière visite — en attente de votre retour",
    };
  }

  const date = new Date(lastConnection);
  const today = new Date();

  if (isSameCalendarDay(date, today)) {
    return {
      id: "last_connection",
      icon: "✨",
      title: "Dernière visite",
      headline: "De retour aujourd'hui",
      message: "Vous êtes revenu aujourd'hui pour continuer votre aventure musicale.",
      journeyState: "confirmed",
      progress: 85,
      ariaLabel: "Dernière connexion aujourd'hui",
    };
  }

  return {
    id: "last_connection",
    icon: "✨",
    title: "Dernière visite",
    headline: formatDateWithTime(lastConnection),
    message: "Continuez votre parcours — la scène vous attend.",
    journeyState: "first_track",
    progress: 60,
    ariaLabel: `Dernière connexion le ${formatDateWithTime(lastConnection)}`,
  };
}

function buildCatalogReleasesCard(
  count: number | null,
  journey: ActivityJourneyState,
): ActivityCardViewModel {
  if (count === null || count <= 0) {
    return {
      id: "catalog_releases",
      icon: "💿",
      title: "Sorties au catalogue",
      headline: "Votre catalogue s'écrit",
      message: "Chaque grand artiste a commencé par une première sortie.",
      journeyState: journey === "confirmed" ? "first_track" : "new_user",
      progress: 15,
      ariaLabel: "Sorties au catalogue — première sortie à venir",
    };
  }

  if (count === 1) {
    return {
      id: "catalog_releases",
      icon: "💿",
      title: "Sorties au catalogue",
      headline: "1 sortie publiée",
      message: "Votre histoire musicale est en train de s'écrire.",
      journeyState: "first_track",
      progress: 55,
      ariaLabel: "Une sortie publiée au catalogue",
    };
  }

  return {
    id: "catalog_releases",
    icon: "💿",
    title: "Sorties au catalogue",
    headline: `${count} sorties publiées`,
    message: "Continuez votre parcours — votre catalogue grandit.",
    journeyState: "confirmed",
    progress: clampProgress(50 + count * 8),
    ariaLabel: `${count} sorties publiées au catalogue`,
  };
}

function buildTracksCard(
  count: number | null,
  journey: ActivityJourneyState,
): ActivityCardViewModel {
  if (count === null || count <= 0) {
    return {
      id: "tracks",
      icon: "🎵",
      title: "Morceaux",
      headline: "Premier morceau à venir",
      message: "Votre premier morceau attend d'être découvert.",
      journeyState: journey === "confirmed" ? "first_track" : "new_user",
      progress: 10,
      ariaLabel: "Morceaux — premier morceau à publier",
    };
  }

  if (count === 1) {
    return {
      id: "tracks",
      icon: "🎵",
      title: "Morceaux",
      headline: "1 morceau en ligne",
      message: "Les premiers fans arrivent souvent plus vite qu'on ne le pense.",
      journeyState: "first_track",
      progress: 45,
      ariaLabel: "Un morceau publié",
    };
  }

  return {
    id: "tracks",
    icon: "🎵",
    title: "Morceaux",
    headline: `${count} morceaux publiés`,
    message: "Votre aventure musicale prend de l'ampleur.",
    journeyState: "confirmed",
    progress: clampProgress(40 + count * 10),
    ariaLabel: `${count} morceaux publiés`,
  };
}

function buildListensCard(isArtist: boolean): ActivityCardViewModel {
  return {
    id: "listens",
    icon: "🎧",
    title: "Écoutes",
    headline: isArtist ? "Vos premières écoutes approchent" : "Votre première écoute",
    message: isArtist
      ? "Votre première écoute sera le début de votre aventure."
      : "Chaque morceau découvert enrichit votre passeport musical.",
    journeyState: isArtist ? "first_track" : "listener",
    progress: 25,
    ariaLabel: "Écoutes — statistiques en préparation",
  };
}

function buildRevenueCard(): ActivityCardViewModel {
  return {
    id: "revenue",
    icon: "💰",
    title: "Revenus",
    headline: "Vos premiers revenus",
    message: "Vos premiers revenus commenceront avec vos premières écoutes.",
    journeyState: "first_listens",
    progress: 20,
    ariaLabel: "Revenus — en attente des premières écoutes",
  };
}

function buildRoyaltiesCard(): ActivityCardViewModel {
  return {
    id: "royalties",
    icon: "📊",
    title: "Royalties",
    headline: "Royalties à venir",
    message: "Les royalties apparaîtront automatiquement après vos premières diffusions.",
    journeyState: "first_revenue",
    progress: 15,
    ariaLabel: "Royalties — calculées après les premières diffusions",
  };
}

export function buildActivityCards(
  activity: ProfileActivitySummary,
  isArtist: boolean,
): ActivityCardViewModel[] {
  const journey = resolveActivityJourneyState(activity, isArtist);

  const cards: ActivityCardViewModel[] = [
    buildMemberSinceCard(activity.memberSince),
    buildLastConnectionCard(activity.lastConnection),
  ];

  if (isArtist) {
    cards.push(
      buildCatalogReleasesCard(activity.publishedAlbums, journey),
      buildTracksCard(activity.publishedTracks, journey),
      buildListensCard(true),
      buildRevenueCard(),
      buildRoyaltiesCard(),
    );
  } else {
    cards.push(buildListensCard(false));
  }

  return cards;
}

export function getJourneyStateLabel(state: ActivityJourneyState): string {
  return JOURNEY_STATE_LABELS[state];
}
