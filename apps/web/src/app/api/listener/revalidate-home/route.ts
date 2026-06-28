import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export async function POST() {
  try {
    await requireIdentityContext();
    revalidateTag("homepage");
    revalidateTag("catalog-tracks");
    revalidateTag("stream-listen-counts");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
