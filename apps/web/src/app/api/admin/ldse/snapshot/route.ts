import { NextResponse } from "next/server";
import { getAdminServiceForApi } from "@/features/admin/lib/getAdminService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAdminServiceForApi();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }

  try {
    const snapshot = await ctx.service.getAdminLiveSnapshot();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "Impossible de charger le snapshot admin." }, { status: 500 });
  }
}
