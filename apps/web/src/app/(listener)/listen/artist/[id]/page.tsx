import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { createListenerService } from "@sonafrik/api/listener";
import { ArtistPublicPageClient } from "@/features/listener/components/ArtistPublicPageClient";
import {
  fetchArtistPublicPageData,
  type ArtistPublicSort,
} from "@/features/listener/lib/fetchArtistPublicPageData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabasePublicClient();
  const listener = createListenerService(supabase);
  const artist = await listener.getPublicArtistProfile(id);
  if (!artist) return { title: "Artiste — SONAFRIK" };

  const description = artist.bio
    ? artist.bio.slice(0, 155)
    : `Écoutez ${artist.stage_name} en streaming sur SONAFRIK.`;

  return {
    title: `${artist.stage_name} — SONAFRIK`,
    description,
    openGraph: {
      title: `${artist.stage_name} — SONAFRIK`,
      description,
      images: artist.cover_path ? [{ url: artist.cover_path }] : [],
    },
  };
}

export default async function ArtistPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rawSort = Array.isArray(sp.sort) ? (sp.sort[0] ?? "recent") : (sp.sort ?? "recent");
  const sort: ArtistPublicSort = ["popular", "recent", "oldest"].includes(rawSort)
    ? (rawSort as ArtistPublicSort)
    : "recent";

  const pageData = await fetchArtistPublicPageData(getSupabasePublicClient(), id, sort);
  if (!pageData) notFound();

  return <ArtistPublicPageClient artistId={id} sort={sort} initialData={pageData} />;
}
