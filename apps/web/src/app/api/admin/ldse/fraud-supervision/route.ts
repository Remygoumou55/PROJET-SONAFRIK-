import { NextResponse } from "next/server";
import { getAdminServiceForApi } from "@/features/admin/lib/getAdminService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAdminServiceForApi();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }

  try {
    const stats = await ctx.service.getFraudSupervisionStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Impossible de charger la supervision fraude." }, { status: 500 });
  }
}
