"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createBeatsService } from "@sonafrik/api/beats";

export async function purchaseBeatAction(
  beatId: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Connexion requise." };

    const service = createBeatsService(supabase);
    await service.purchaseBeat(beatId);
    revalidatePath("/listen/beats");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function createBeatAction(params: {
  title: string;
  priceGnf: number;
  description?: string;
  bpm?: number;
  key?: string;
  genre?: string;
  licenseType?: string;
}): Promise<{ error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Connexion requise." };

    const service = createBeatsService(supabase);
    await service.createBeat(params);
    revalidatePath("/listen/beats");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
