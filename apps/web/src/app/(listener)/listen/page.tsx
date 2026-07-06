import { createPublicCachedQuery } from "@/lib/cache";
import type { Metadata } from "next";
import type { ListenMusicCategory } from "@sonafrik/types";
import { parseListenMusicCategory } from "@sonafrik/api/listener";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { HomepageHero } from "@/features/listener/components/HomepageHero";
import { ListenStreamingHeader } from "@/features/listener/components/ListenStreamingHeader";
import { DiscoveriesSection } from "@/features/listener/components/DiscoveriesSection";
import { HomepageContentLive } from "@/features/listener/components/HomepageContentLive";
import { ListenTrackDeepLink } from "@/features/listener/components/ListenTrackDeepLink";
import type { HomepageData } from "@/features/listener/components/HomepageContentSections";
import { fetchHomepageData } from "@/features/listener/lib/fetchHomepageData";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

function createHomepageLoader(category: ListenMusicCategory) {
  return createPublicCachedQuery(
    `homepage-content-v8-${category}`,
    async function _getHomepageContent(): Promise<HomepageData> {
      return fetchHomepageData(getSupabasePublicClient(), category);
    },
    { revalidate: 300, tags: ["homepage", "catalog-tracks", "stream-listen-counts"] },
  );
}

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; track?: string }>;
}) {
  const params = await searchParams;
  const category = parseListenMusicCategory(params.category);
  const deepLinkTrackId = params.track?.trim() || null;

  const [content, { profile, unreadNotifications }] = await Promise.all([
    createHomepageLoader(category)(),
    requireIdentityContext(),
  ]);

  return (
    <div className="listen-page" style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      <ListenStreamingHeader fullName={profile.full_name} unreadNotifications={unreadNotifications} />
      <HomepageHero fullName={profile.full_name} />
      {deepLinkTrackId ? <ListenTrackDeepLink trackId={deepLinkTrackId} /> : null}
      {content.discoveryTracks.length > 0 ? (
        <DiscoveriesSection tracks={content.discoveryTracks} />
      ) : null}
      <HomepageContentLive category={category} initialData={content} />
    </div>
  );
}
