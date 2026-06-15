import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminCatalogCenter } from "@/features/admin/components/AdminCatalogCenter";

export const metadata = { title: "Revue Catalogue — Admin SONAFRIK" };

export default async function AdminCatalogPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const [albumsRes, tracksRes] = await Promise.all([
    supabase
      .from("albums")
      .select("id, title, release_type, submitted_at, creator_id, artist_profiles(stage_name)")
      .eq("publication_status", "pending_review")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: true })
      .limit(200),
    supabase
      .from("tracks")
      .select("id, title, submitted_at, creator_id, artist_profiles(stage_name)")
      .eq("publication_status", "pending_review")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: true })
      .limit(200),
  ]);

  type AlbumRow = {
    id: string;
    title: string;
    release_type: string | null;
    submitted_at: string | null;
    creator_id: string;
    artist_profiles: { stage_name: string } | { stage_name: string }[] | null;
  };
  type TrackRow = {
    id: string;
    title: string;
    submitted_at: string | null;
    creator_id: string;
    artist_profiles: { stage_name: string } | { stage_name: string }[] | null;
  };

  function getStageName(
    ap: { stage_name: string } | { stage_name: string }[] | null,
  ): string | null {
    if (!ap) return null;
    if (Array.isArray(ap)) return ap[0]?.stage_name ?? null;
    return ap.stage_name;
  }

  const pendingAlbums = ((albumsRes.data ?? []) as unknown as AlbumRow[]).map((a) => ({
    id: a.id,
    type: "album" as const,
    title: a.title,
    creator_name: getStageName(a.artist_profiles),
    submitted_at: a.submitted_at,
    release_type: a.release_type ?? "album",
  }));

  const pendingTracks = ((tracksRes.data ?? []) as unknown as TrackRow[]).map((t) => ({
    id: t.id,
    type: "track" as const,
    title: t.title,
    creator_name: getStageName(t.artist_profiles),
    submitted_at: t.submitted_at,
  }));

  const items = [...pendingAlbums, ...pendingTracks].sort((a, b) => {
    if (!a.submitted_at) return 1;
    if (!b.submitted_at) return -1;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <AdminCatalogCenter initialItems={items} />
    </div>
  );
}
