"use client";

import { useEffect, useState } from "react";
import type { CreatorDashboardData } from "@sonafrik/types";
import { HeroCard } from "../dashboard/components/HeroCard";
import { KpiGrid } from "../dashboard/components/KpiCard";
import { QuickActions } from "../dashboard/components/QuickActions";
import { AssistantCard } from "../dashboard/components/AssistantCard";
import { ActivityFeed } from "../dashboard/components/ActivityFeed";
import { CareerOsCard } from "../dashboard/components/career-os";
import { InspirationSection } from "../dashboard/components/InspirationSection";
import { filterValidInspirationArtists } from "../dashboard/lib/inspirationArtists.presentation";
import { WelcomeModal } from "../dashboard/components/WelcomeModal";

export function CreatorDashboardView({ data }: { data: CreatorDashboardData }) {
  const {
    context,
    hero,
    kpis,
    activities,
    careerOs,
    assistantTips,
    quickActions,
    catalogCounts,
    inspirationArtists,
    profileSlug,
    profileCreatedAt,
  } = data;

  const [profileUrl, setProfileUrl] = useState(`/listen/artist/${profileSlug}`);

  useEffect(() => {
    setProfileUrl(`${window.location.origin}/listen/artist/${profileSlug}`);
  }, [profileSlug]);

  const validInspirationArtists = filterValidInspirationArtists(inspirationArtists);
  const showInspiration =
    catalogCounts.tracksPublished === 0 && validInspirationArtists.length > 0;
  const pulsePublish = catalogCounts.tracksPublished === 0;

  return (
    <div className="creator-dashboard">
      <WelcomeModal stageName={context.artistProfile.stage_name} profileCreatedAt={profileCreatedAt} />

      <HeroCard
        hero={hero}
        artistProfile={context.artistProfile}
        creator={context.creator}
        profileCreatedAt={profileCreatedAt}
        kpis={kpis}
      />

      <AssistantCard tips={assistantTips} profileUrl={profileUrl} />

      <QuickActions actions={quickActions} pulsePrimary={pulsePublish} />

      <div className="creator-two-col">
        <KpiGrid kpis={kpis} profileUrl={profileUrl} />
        <CareerOsCard careerOs={careerOs} />
      </div>

      <div className="creator-bottom-sections">
        <ActivityFeed activities={activities} />
        {showInspiration ? <InspirationSection artists={validInspirationArtists} /> : null}
      </div>
    </div>
  );
}
