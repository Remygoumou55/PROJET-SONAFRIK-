import { NextResponse } from "next/server";
import { fetchLandingStats } from "@/lib/landing/fetchLandingStats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await fetchLandingStats();
  return NextResponse.json(stats);
}
