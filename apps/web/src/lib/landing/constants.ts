/** Objectif unique de lancement — toutes les occurrences landing doivent utiliser cette valeur. */
export const SUBSCRIBER_TARGET = 2000;

export const ACTIVE_STREAM_HEARTBEAT_MINUTES = 3;

export interface LandingPublicStats {
  visible: boolean;
  activeStreams: number;
  totalArtists: number;
  royaltiesPaidGnf: number;
  monthlyRoyaltiesGnf: number;
}
