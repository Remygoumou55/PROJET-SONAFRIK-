import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAuthService } from "@sonafrik/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSubscriberCount } from "@/lib/landing/getSubscriberCount";
import {
  LandingPage,
  LandingNav,
  LandingHero,
  LandingProgress,
  LandingPillars,
  LandingHowItWorks,
  LandingArtists,
  LandingPlans,
  LandingTransparencyNote,
  LandingComingSoon,
  LandingFinalCTA,
} from "@/components/landing";

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

function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        margin: "0 0 56px",
      }}
    />
  );
}

export default async function LandingV5Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // OAuth code redirigé vers la racine par Supabase si la redirect URL n'est pas configurée
  if (params.code) {
    const qs = new URLSearchParams({ code: params.code });
    if (params.next) qs.set("next", params.next);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  // BYPASS_AUTH=true → dev local sans vraie session.
  // On court-circuite TOUS les appels DB pour éviter le hang sur cold start Supabase.
  const isBypass = process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1";

  let profile = null;
  let subscriberCount = 0;

  if (isBypass) {
    // Pas de DB en mode bypass — valeur mock pour l'affichage du compteur
    subscriberCount = 42;
  } else {
    // Démarrage parallèle : subscriber count + auth check → gain ~50-100ms
    const subscriberCountPromise = getSubscriberCount();

    const supabase = await getSupabaseServerClient();
    const auth = createAuthService(supabase);
    try {
      profile = await auth.getCurrentProfile();
    } catch {
      // Supabase indisponible → traiter comme visiteur anonyme
    }

    if (profile?.onboarding_completed) redirect("/listen");
    if (profile && !profile.onboarding_completed) redirect("/auth/inscription");

    subscriberCount = await subscriberCountPromise;
  }

  return (
    <LandingPage>
      <LandingNav />
      <LandingHero>
        <LandingProgress subscriberCount={subscriberCount} />
      </LandingHero>
      <Divider />
      <LandingPillars />
      <LandingHowItWorks />
      <Divider />
      <LandingArtists />
      <LandingPlans />
      <LandingTransparencyNote />
      <Divider />
      <LandingComingSoon />
      <LandingFinalCTA />
    </LandingPage>
  );
}
