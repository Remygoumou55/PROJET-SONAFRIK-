import { NextResponse } from "next/server";
import { createListenerService } from "@sonafrik/api/listener";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireIdentityContext();
    const { id } = await context.params;
    const client = await getSupabaseServerClient();
    const listener = createListenerService(client);
    const counts = await listener.getTrackListenCounts(id);
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
