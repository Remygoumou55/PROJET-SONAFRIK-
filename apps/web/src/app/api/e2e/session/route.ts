import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const LISTENER_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "s13b-playwright-listener@sonafrik.test";
const LISTENER_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "S13BCert2026!";
const CREATOR_EMAIL =
  process.env.PLAYWRIGHT_CREATOR_EMAIL ?? "s12b-artist-1-1782222972289@sonafrik.test";
const CREATOR_PASSWORD = process.env.PLAYWRIGHT_CREATOR_PASSWORD ?? "Sprint12BTest2026!";

/** Connexion E2E — cookies SSR réels (dev local uniquement, jamais Vercel). */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL === "1") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const role = new URL(request.url).searchParams.get("role");
  const email = role === "creator" ? CREATOR_EMAIL : LISTENER_EMAIL;
  const password = role === "creator" ? CREATOR_PASSWORD : LISTENER_PASSWORD;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true, role: role === "creator" ? "creator" : "listener" });
}
