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
  const r = await Promise.resolve(q);
  if (r.error) {
    const detail =
      r.error instanceof Error
        ? r.error.message
        : typeof r.error === "object" && r.error !== null && "message" in r.error
          ? String((r.error as { message: unknown }).message)
          : String(r.error);
    throw new Error(`countQuery failed: ${detail}`);
  }
  return r.count ?? 0;
}

export type AdminRepoClient = SonafrikSupabaseClient;
