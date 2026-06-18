import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSubscriberCount(): Promise<number> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_launch_progress" as never);
    if (error || !data) return 0;
    const raw = data as { current: number; target: number };
    return Number(raw.current);
  } catch {
    return 0;
  }
}
