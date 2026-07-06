import type { DiscoveryTrack } from "@sonafrik/types";
import { filterValidTracks } from "@/lib/content-filter";
import { DiscoveriesSectionClient } from "./discoveries/DiscoveriesSectionClient";
import { DiscoveriesSectionShell } from "./discoveries/DiscoveriesSectionShell";
import { DEFAULT_TIME_FILTER, getFilteredTracks } from "./discoveries/discoveries.utils";

interface DiscoveriesSectionProps {
  tracks: DiscoveryTrack[];
}

/**
 * Découvertes — Server Island + Client Island.
 * Shell SSR pour le LCP ; interactions Player isolées dans le client island.
 */
export function DiscoveriesSection({ tracks }: DiscoveriesSectionProps) {
  const validTracks = filterValidTracks(tracks);
  if (validTracks.length === 0) return null;

  const now = new Date();
  const initialFiltered = getFilteredTracks(validTracks, DEFAULT_TIME_FILTER, now);

  return (
    <DiscoveriesSectionClient
      validTracks={validTracks}
      initialFilter={DEFAULT_TIME_FILTER}
      initialFilteredCount={initialFiltered.length}
    >
      <DiscoveriesSectionShell tracks={initialFiltered} nowIso={now.toISOString()} />
    </DiscoveriesSectionClient>
  );
}
