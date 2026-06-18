import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAuthService } from "@sonafrik/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "SONAFRIK — Notre Bien Commun",
  description:
    "Rejoignez le mouvement SONAFRIK. Plateforme de streaming musical guinéenne en route vers son lancement officiel.",
  openGraph: {
    title: "SONAFRIK — Notre Bien Commun",
    description: "2 000 abonnés = lancement de la plateforme musicale guinéenne.",
    siteName: "SONAFRIK",
  },
};

export default async function LandingPage({
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

  if (profile?.onboarding_completed) redirect("/listen");
  if (profile && !profile.onboarding_completed) redirect("/auth/inscription");

  // Visiteur anonyme → landing V5 (contenu assemblé en Tâche 10)
  return (
    <div style={{ backgroundColor: "#0D0D0D", minHeight: "100vh", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Landing V5 — en construction</p>
    </div>
  );
}
