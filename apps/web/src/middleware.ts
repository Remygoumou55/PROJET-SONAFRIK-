import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getHomeByRole } from "@/lib/auth/redirectByRole";
import { mapAccountType } from "@/lib/auth/getSessionAndRole";

function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

// Dev bypass : BYPASS_AUTH=true OU NODE_ENV=development. Jamais sur Vercel.
function isBypassActive(): boolean {
  return (
    (process.env.BYPASS_AUTH === "true" ||
      process.env.NODE_ENV === "development") &&
    process.env.VERCEL !== "1"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Réponse initiale — sera mutée si les cookies auth changent
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Rafraîchissement du token Supabase — ne jamais remplacer par getSession()
  let user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"] = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase indisponible → routes publiques passent
  }

  if (isBypassActive()) return response;

  const isAuthRoute =
    pathname.startsWith("/auth/") && pathname !== "/auth/callback";
  const isOnboarding = pathname.startsWith("/onboarding");
  const isProtected = [
    "/listen",
    "/creator",
    "/wallet",
    "/profile",
    "/settings",
    "/library",
    "/search",
    "/notifications",
  ].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  // Pas de session → connexion (routes protégées), landing (onboarding)
  if (!user) {
    if (isProtected || isAdminRoute) {
      const dest = new URL("/auth/connexion", request.url);
      dest.searchParams.set("next", pathname);
      return NextResponse.redirect(dest);
    }
    if (isOnboarding) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // Session active : fetch profil uniquement pour les routes nécessitant
  // une décision de routing (pages auth + onboarding).
  // Pour les routes protégées, les layouts gèrent le check onboarding et le rôle
  // via requireIdentityContext() + redirectIfOnboardingIncomplete() → économise
  // 1 round-trip DB par navigation.
  if (
    (isAuthRoute && !pathname.startsWith("/auth/inscription")) ||
    isOnboarding
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, onboarding_completed")
      .eq("id", user.id)
      .single();

    const role = mapAccountType(profile?.account_type);
    const onboardingCompleted = profile?.onboarding_completed ?? false;

    // Connecté sur une page auth + onboarding terminé → home par rôle
    if (isAuthRoute && onboardingCompleted) {
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url));
    }

    // Onboarding terminé + sur une page onboarding → home
    if (isOnboarding && onboardingCompleted) {
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url));
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
