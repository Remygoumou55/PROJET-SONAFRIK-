import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAuthService } from "@sonafrik/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSubscriberCount } from "@/lib/landing/getSubscriberCount";
import {
  LandingPage,
  LandingHero,
  LandingProgress,
  LandingPillars,
  LandingHowItWorks,
  LandingPartners,
  LandingArtists,
  LandingPlans,
  LandingTransparencyNote,
  Roadmap,
  Testimonials,
  LandingFinalCTA,
  LandingFooter,
} from "@/components/landing";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LiveStatsSkeleton } from "@/components/landing/LiveStatsSkeleton";

const LiveStats = dynamic(
  () => import("@/components/landing/LiveStats").then((m) => m.LiveStats),
  { loading: () => <LiveStatsSkeleton /> },
);

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
        margin: "0 0 48px",
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

  if (params.code) {
    const qs = new URLSearchParams({ code: params.code });
    if (params.next) qs.set("next", params.next);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const isBypass = process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1";

  let profile = null;
  let subscriberCount = 0;

  if (isBypass) {
    subscriberCount = 42;
  } else {
    const subscriberCountPromise = getSubscriberCount();
    const supabase = await getSupabaseServerClient();
    const auth = createAuthService(supabase);
    try {
      profile = await auth.getCurrentProfile();
    } catch {
      // visiteur anonyme
    }

    if (profile?.onboarding_completed) redirect("/listen");
    if (profile && !profile.onboarding_completed) redirect("/auth/connexion");

    subscriberCount = await subscriberCountPromise;
  }

  return (
    <LandingPage>
      <LandingNav />
      <LandingHero>
        <LandingProgress subscriberCount={subscriberCount} />
      </LandingHero>
      <LiveStats />
      <LandingHowItWorks />
      <Divider />
      <LandingPillars />
      <LandingPartners />
      <LandingArtists />
      <LandingPlans />
      <LandingTransparencyNote />
      <Roadmap />
      <Testimonials />
      <LandingFAQ />
      <LandingFinalCTA />
      <LandingFooter />
    </LandingPage>
  );
}
