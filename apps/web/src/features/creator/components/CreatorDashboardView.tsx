"use client";

import type { CreatorDashboardData } from "@sonafrik/types";
import { HeroCard } from "../dashboard/components/HeroCard";
import { QuickActions } from "../dashboard/components/QuickActions";
import { ActivityFeed } from "../dashboard/components/ActivityFeed";
import { WelcomeModal } from "../dashboard/components/WelcomeModal";
import {
  GlanceKpiGrid,
  NextObjectiveCard,
  WeeklySonafrikPanel,
  ConseilBanner,
  StatsCareerSection,
} from "../dashboard/components/enterprise";

interface CreatorDashboardViewProps {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
}

export function CreatorDashboardView({ data, careerOsEnabled = false }: CreatorDashboardViewProps) {
  const {
    context,
    hero,
    kpis,
    activities,
    careerOs,
    assistantTips,
    quickActions,
    catalogCounts,
    timeline,
    profileCreatedAt,
  } = data;

  const pulsePublish = catalogCounts.tracksPublished === 0;

  return (
    <div className="creator-dashboard creator-dashboard--enterprise">
      <WelcomeModal
        stageName={context.artistProfile.stage_name}
        profileCreatedAt={profileCreatedAt}
      />

      <HeroCard
        hero={hero}
        artistProfile={context.artistProfile}
        creator={context.creator}
        profileCreatedAt={profileCreatedAt}
      />

      <GlanceKpiGrid data={data} />

      {careerOsEnabled ? <NextObjectiveCard careerOs={careerOs} /> : null}

      <QuickActions
        actions={quickActions}
        pulsePrimary={pulsePublish}
        sectionId="creator-quick-actions"
      />

      {careerOsEnabled ? (
        <StatsCareerSection kpis={kpis} timeline={timeline} careerOs={careerOs} />
      ) : null}

      <div className="dash-bottom-row">
        <ActivityFeed activities={activities} />
        <WeeklySonafrikPanel data={data} />
      </div>

      <ConseilBanner tips={assistantTips} />
    </div>
  );
}
