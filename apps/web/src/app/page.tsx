import { redirect } from "next/navigation";
import { createAuthService } from "@sonafrik/api/auth";
import { AuthHomeActions } from "@/features/auth/components/AuthHomeActions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // Supabase redirige parfois le code OAuth vers la racine si la redirect URL
  // n'est pas encore dans la liste autorisée du dashboard
  if (params.code) {
    const qs = new URLSearchParams({ code: params.code });
    if (params.next) qs.set("next", params.next);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const supabase = await getSupabaseServerClient();
  const auth = createAuthService(supabase);
  let profile = null;
  try {
    profile = await auth.getCurrentProfile();
  } catch {
    // Supabase indisponible → traiter comme visiteur anonyme
  }

  if (!profile) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-10 px-6"
        style={{ backgroundColor: "#0D0D0D" }}
      >
        {/* Logo animé */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight leading-none mb-2">
            <span style={{ color: "#FFFFFF" }}>SONA</span>
            <span style={{ color: "#00D26A" }}>FRIK</span>
          </h1>
          <div className="flex items-center gap-2 justify-center mb-1">
            <div className="h-px w-8" style={{ backgroundColor: "#FFC20E" }} />
            <p className="text-xs font-bold tracking-[0.25em]" style={{ color: "#FFC20E" }}>
              NOTRE BIEN COMMUN
            </p>
            <div className="h-px w-8" style={{ backgroundColor: "#FFC20E" }} />
          </div>
          <p className="text-sm mt-3" style={{ color: "#555555" }}>
            Écoute · Participe · Prospère
          </p>
        </div>
        <AuthHomeActions />
      </main>
    );
  }

  if (!profile.onboarding_completed) {
    redirect("/auth/inscription");
  }

  redirect("/listen");
}
