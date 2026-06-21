import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Client anon public — pas de cookies, résultat identique pour tous les visiteurs
// => safe à mettre en cache cross-request avec unstable_cache
const _fetchSubscriberCount = async (): Promise<number> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return 0;

  try {
    // AbortController — évite le hang infini sur cold start Supabase free tier
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const supabase = createClient(url, key, {
      global: { fetch: (input, init) => fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer)) },
    });
    const { data, error } = await supabase.rpc("get_launch_progress");
    if (error || !data) return 0;
    const raw = data as { current: number; target: number };
    return Number(raw.current);
  } catch {
    return 0;
  }
};

// Cache 5 minutes cross-request — réduit les appels Supabase de N req/min à 1 req/5 min
export const getSubscriberCount = unstable_cache(
  _fetchSubscriberCount,
  ["landing-subscriber-count"],
  { revalidate: 300, tags: ["subscriber-count"] },
);
