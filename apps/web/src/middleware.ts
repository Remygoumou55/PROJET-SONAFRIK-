import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getHomeByRole } from "@/lib/auth/redirectByRole";
import { mapAccountType } from "@/lib/auth/getSessionAndRole";
import { isMiddlewareBypassActive } from "@/lib/auth/guards";

function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

// Dev bypass : BYPASS_AUTH=true explicite uniquement. Jamais sur Vercel.
function isBypassActive(): boolean {
  return isMiddlewareBypassActive();
}

// Race Supabase contre un timeout — évite de bloquer le middleware indéfiniment
// sur cold start Supabase (free tier peut prendre 10-30s à répondre).
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Court-circuit total en dev — aucun appel Supabase, aucune redirection auth.
  // BYPASS_AUTH ne doit JAMAIS être actif sur Vercel (vérification dans requireXxx).
  if (isBypassActive()) return NextResponse.next({ request });

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

  // Session cookie (rapide, local) puis validation réseau avec timeout.
  // Évite les redirects auth intempestifs quand Supabase cold-start dépasse le délai.
  const { data: { session } } = await supabase.auth.getSession();
  let user = session?.user ?? null;

  if (!user) {
    try {
      user = await withTimeout(
        supabase.auth.getUser().then((r) => r.data.user),
        4000,
        null,
      );
    } catch {
      // Supabase indisponible — pas de session locale
    }
  } else if (isAdminRoute) {
    try {
      const verified = await withTimeout(
        supabase.auth.getUser().then((r) => r.data.user),
        4000,
        session!.user,
      );
      user = verified ?? session!.user;
    } catch {
      user = session!.user;
    }
  }

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

  // Routes admin : session requise — is_admin vérifié par requireAdmin() (layout SSR).
  // Évite les faux refus quand le RPC Supabase dépasse le timeout middleware (cold start).
  if (isAdminRoute) {
    return response;
  }

  // Session active : fetch profil uniquement pour les routes nécessitant
  // une décision de routing (pages auth + onboarding).
  if (
    (isAuthRoute || isOnboarding)
  ) {
    const profile = await withTimeout(
      Promise.resolve(
        supabase
          .from("profiles")
          .select("account_type, onboarding_completed")
          .eq("id", user.id)
          .single()
      ).then((r) => r.data),
      4000,
      null,
    );
    const role = mapAccountType(profile?.account_type);
    const onboardingCompleted = profile?.onboarding_completed ?? false;

    if (isAuthRoute && onboardingCompleted) {
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url));
    }

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
