import { NextResponse } from "next/server";
import { getAdminServiceForApi } from "@/features/admin/lib/getAdminService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAdminServiceForApi();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }

  try {
    const dashboard = await ctx.service.getAnalyticsDashboard();
    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({ error: "Impossible de charger les analytiques." }, { status: 500 });
  }
}
