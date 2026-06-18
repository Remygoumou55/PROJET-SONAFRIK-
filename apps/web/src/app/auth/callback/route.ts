import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) return { url, anonKey };
  if (process.env.NODE_ENV === "production") {
    throw new Error("[SONAFRIK] NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis en production.");
  }
  return {
    url: "http://127.0.0.1:54321",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role"); // 'artist' | 'listener' | null (depuis landing)

  // NEXT_PUBLIC_APP_URL fixe l'URL stable (prod Vercel) pour éviter les URLs de preview
  const redirectBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? origin;

  if (!code) {
    return NextResponse.redirect(`${redirectBase}/auth/connexion?error=oauth`);
  }

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[OAuth callback error]", error.message, error.code ?? "");
    }
    const errParams =
      process.env.NODE_ENV !== "production"
        ? `?error=oauth&reason=${encodeURIComponent(error.message)}`
        : "?error=oauth";
    return NextResponse.redirect(`${redirectBase}/auth/connexion${errParams}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${redirectBase}/auth/connexion?error=oauth`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, onboarding_completed")
    .eq("id", user.id)
    .single();

  // Onboarding déjà complété → aller directement à l'espace
  if (profile?.onboarding_completed && profile?.account_type) {
    const home =
      profile.account_type === "auditeur"
        ? "/listen"
        : profile.account_type === "artiste" ||
            profile.account_type === "auditeur_artiste"
          ? "/creator"
          : "/onboarding/role";
    return NextResponse.redirect(`${redirectBase}${home}`);
  }

  // Rôle fourni depuis la landing page → sauvegarder account_type + aller à l'onboarding spécifique
  if (roleParam === "artist" || roleParam === "listener") {
    const accountType = roleParam === "artist" ? "artiste" : "auditeur";
    await supabase
      .from("profiles")
      .update({ account_type: accountType })
      .eq("id", user.id);

    const onboardingPath =
      roleParam === "artist" ? "/onboarding/artist" : "/onboarding/listener";
    return NextResponse.redirect(`${redirectBase}${onboardingPath}`);
  }

  // Pas de rôle → page de choix
  return NextResponse.redirect(`${redirectBase}/onboarding/role`);
}
