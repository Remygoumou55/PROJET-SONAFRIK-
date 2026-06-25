"use client";

import { useEffect, useState } from "react";
import type { CreatorDashboardData } from "@sonafrik/types";
import { HeroCard } from "../dashboard/components/HeroCard";
import { KpiGrid } from "../dashboard/components/KpiCard";
import { QuickActions } from "../dashboard/components/QuickActions";
import { AssistantCard } from "../dashboard/components/AssistantCard";
import { ActivityFeed } from "../dashboard/components/ActivityFeed";
import { GoalsSection } from "../dashboard/components/GoalsSection";
import { RevenueSection } from "../dashboard/components/RevenueSection";
import { CareerProgressCard } from "../dashboard/components/CareerProgressCard";
import { InspirationSection } from "../dashboard/components/InspirationSection";
import { WelcomeModal } from "../dashboard/components/WelcomeModal";
import { DashboardGrid, WidgetContainer } from "../dashboard/components/DashboardGrid";

export function CreatorDashboardView({ data }: { data: CreatorDashboardData }) {
  const {
    context,
    hero,
    kpis,
    activities,
    goals,
    careerSteps,
    assistantTips,
    quickActions,
    revenueStats,
    catalogCounts,
    inspirationArtists,
    monthlyRevenue,
    revenueProjectionGnf,
    profileSlug,
    profileCreatedAt,
  } = data;

  const [profileUrl, setProfileUrl] = useState(`/listen/artist/${profileSlug}`);

  useEffect(() => {
    setProfileUrl(`${window.location.origin}/listen/artist/${profileSlug}`);
  }, [profileSlug]);

  const showInspiration = catalogCounts.tracksPublished === 0 && inspirationArtists.length > 0;
  const pulsePublish = catalogCounts.tracksPublished === 0;

  return (
    <div className="creator-dashboard">
      <WelcomeModal stageName={context.artistProfile.stage_name} profileCreatedAt={profileCreatedAt} />

      <HeroCard hero={hero} artistProfile={context.artistProfile} />

      <AssistantCard tips={assistantTips} profileUrl={profileUrl} />

      <QuickActions actions={quickActions} pulsePrimary={pulsePublish} />

      <KpiGrid kpis={kpis} profileUrl={profileUrl} />

      <DashboardGrid>
        <WidgetContainer>
          <CareerProgressCard steps={careerSteps} />
        </WidgetContainer>
        <WidgetContainer>
          <GoalsSection goals={goals} />
        </WidgetContainer>
      </DashboardGrid>

      <RevenueSection
        revenue={revenueStats}
        monthlyRevenue={monthlyRevenue}
        revenueProjectionGnf={revenueProjectionGnf}
      />

      <ActivityFeed activities={activities} />

      {showInspiration ? <InspirationSection artists={inspirationArtists} /> : null}
    </div>
  );
}
