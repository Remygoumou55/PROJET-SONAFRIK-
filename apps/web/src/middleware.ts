import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getHomeByRole } from "@/lib/auth/redirectByRole";
import { mapAccountType } from "@/lib/auth/getSessionAndRole";
import { isMiddlewareBypassActive } from "@/lib/auth/guards";
import { applySecurityHeaders, buildContentSecurityPolicy } from "@/lib/security/csp";

function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function withSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  if (!response.headers.has("Content-Security-Policy")) {
    applySecurityHeaders(response, nonce);
  }
  return response;
}

function nextWithNonce(request: NextRequest, nonce: string): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const csp = buildContentSecurityPolicy(nonce, isProd);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js parse le CSP de la requête pour injecter le nonce sur les scripts SSR.
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response, nonce);
  return response;
}

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
  const nonce = generateCspNonce();
  const secure = (response: NextResponse) => withSecurityHeaders(response, nonce);

  // Court-circuit total en dev — aucun appel Supabase, aucune redirection auth.
  // BYPASS_AUTH ne doit JAMAIS être actif sur Vercel (vérification dans requireXxx).
  if (isBypassActive()) return secure(nextWithNonce(request, nonce));

  // Réponse initiale — sera mutée si les cookies auth changent
  let response = nextWithNonce(request, nonce);

  const env = getSupabaseEnv();
  if (!env) return secure(response);

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
        response = nextWithNonce(request, nonce);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const isAuthRoute =
    pathname.startsWith("/auth/") && pathname !== "/auth/callback";
  const isOnboarding = pathname.startsWith("/onboarding");
  const isCreatorRoute =
    pathname === "/creator" || pathname.startsWith("/creator/");
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
      return secure(NextResponse.redirect(dest));
    }
    if (isOnboarding) {
      return secure(NextResponse.redirect(new URL("/", request.url)));
    }
    return secure(response);
  }

  // Routes admin : session + is_admin (RPC). Fail-closed si RPC timeout/erreur.
  if (isAdminRoute) {
    const isAdmin = await withTimeout(
      Promise.resolve(
        supabase.rpc("is_admin", { p_user_id: user.id }).then((r) => (r.error ? null : r.data === true)),
      ),
      4000,
      null,
    );

    if (isAdmin !== true) {
      const dest = new URL("/listen", request.url);
      dest.searchParams.set("error", "admin_denied");
      return secure(NextResponse.redirect(dest));
    }

    return secure(response);
  }

  // Espace artiste : profil + onboarding avant le layout (évite skeleton infini + redirect RSC).
  if (isCreatorRoute) {
    const profile = await withTimeout(
      Promise.resolve(
        supabase
          .from("profiles")
          .select("account_type, onboarding_completed")
          .eq("id", user.id)
          .single(),
      ).then((r) => r.data),
      4000,
      null,
    );

    if (!profile) {
      const dest = new URL("/auth/connexion", request.url);
      dest.searchParams.set("next", pathname);
      return secure(NextResponse.redirect(dest));
    }

    if (!profile.onboarding_completed) {
      if (profile.account_type === "artiste" || profile.account_type === "auditeur_artiste") {
        return secure(NextResponse.redirect(new URL("/onboarding/artist", request.url)));
      }
      if (profile.account_type === "auditeur") {
        return secure(NextResponse.redirect(new URL("/onboarding/listener", request.url)));
      }
      return secure(NextResponse.redirect(new URL("/onboarding/role", request.url)));
    }

    if (profile.account_type !== "artiste" && profile.account_type !== "auditeur_artiste") {
      return secure(NextResponse.redirect(new URL("/profile", request.url)));
    }

    return secure(response);
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
      return secure(NextResponse.redirect(new URL(getHomeByRole(role), request.url)));
    }

    if (isOnboarding && onboardingCompleted) {
      return secure(NextResponse.redirect(new URL(getHomeByRole(role), request.url)));
    }

    return secure(response);
  }

  return secure(response);
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
