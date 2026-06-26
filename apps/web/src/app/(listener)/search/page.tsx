import type { Metadata } from "next";
import { SearchPage } from "@/features/listener/components/SearchPage";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createListenerService } from "@sonafrik/api/listener";

export const metadata: Metadata = {
  title: "Recherche — SONAFRIK",
  description: "Recherchez des morceaux, albums et artistes sur SONAFRIK.",
};

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; q?: string }>;
}) {
  const { genre, q } = await searchParams;
  const supabase = await getSupabaseServerClient();
  const listener = createListenerService(supabase);
  const beatStoreEnabled = await listener.isFeatureEnabled("beat_store");

  return (
    <SearchPage
      initialGenre={genre}
      initialQuery={q}
      beatStoreEnabled={beatStoreEnabled}
    />
  );
}
