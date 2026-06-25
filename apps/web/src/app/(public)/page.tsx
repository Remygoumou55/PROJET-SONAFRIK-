import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAuthService } from "@sonafrik/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getLaunchProgress } from "@/lib/landing/getLaunchProgress";
import { getLandingArtistsSection } from "@/lib/landing/getLandingArtistsSection";
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
  LandingFAQ,
} from "@/components/landing";
import { LiveStatsSkeleton } from "@/components/landing/LiveStatsSkeleton";

const LandingNav = dynamic(
  () => import("@/components/landing/LandingNav").then((m) => m.LandingNav),
);

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
  return <hr className="mb-12 border-0 border-t border-white/[0.06]" />;
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

  const launchProgressPromise = getLaunchProgress();
  const artistsSectionPromise = getLandingArtistsSection();

  let profile = null;

  if (!isBypass) {
    const supabase = await getSupabaseServerClient();
    const auth = createAuthService(supabase);
    try {
      profile = await auth.getCurrentProfile();
    } catch {
      // visiteur anonyme
    }

    if (profile?.onboarding_completed) redirect("/listen");
    if (profile && !profile.onboarding_completed) redirect("/auth/connexion");
  }

  const [launchProgress, artistsSection] = await Promise.all([
    launchProgressPromise,
    artistsSectionPromise,
  ]);

  return (
    <LandingPage>
      <LandingNav />
      <LandingHero>
        <LandingProgress
          subscriberCount={launchProgress.current}
          subscriberTarget={launchProgress.target}
        />
      </LandingHero>
      <LiveStats />
      <LandingHowItWorks featuredTrack={artistsSection.featuredTrack} />
      <Divider />
      <LandingPillars />
      <LandingPartners />
      <LandingArtists section={artistsSection} />
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
