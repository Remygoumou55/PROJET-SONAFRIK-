import { NextResponse } from "next/server";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const listener = createListenerService(supabase);
  const enabled = await listener.isFeatureEnabled("listen_discover_mode");
  if (!enabled) {
    return NextResponse.json({ error: "Fonctionnalité désactivée" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 20;

  try {
    const tracks = await listener.getDiscoverModeTracks(user.id, limit);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
