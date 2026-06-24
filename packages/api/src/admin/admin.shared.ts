import type { SonafrikSupabaseClient } from "@sonafrik/database";

export function getStageName(
  ap: { stage_name: string } | { stage_name: string }[] | null,
): string | null {
  if (!ap) return null;
  if (Array.isArray(ap)) return ap[0]?.stage_name ?? null;
  return ap.stage_name;
}

export async function countQuery(
  q: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const r = await Promise.resolve(q);
    if (r.error) return 0;
    return r.count ?? 0;
  } catch {
    return 0;
  }
}

export type AdminRepoClient = SonafrikSupabaseClient;
