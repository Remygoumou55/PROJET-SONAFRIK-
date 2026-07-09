"use client";
import type { CreatorDashboardData } from "@sonafrik/types";
import { buildDashboardKpiBand } from "@sonafrik/api/creator/presentation";
import {
  DashboardCoachCard,
  DashboardKpiBand,
  DashboardWalletCard,
} from "@/features/shared/dashboard";
import { useCreatorDashboardSrtspLive } from "../dashboard/hooks/useCreatorDashboardSrtspLive";
import { DashboardPremiumCard } from "../dashboard/components/DashboardPremiumCard";
import { HeroCard } from "../dashboard/components/HeroCard";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const WelcomeModal = dynamic(
  () => import("../dashboard/components/WelcomeModal").then((m) => ({ default: m.WelcomeModal })),
  { ssr: false },
);

interface Props {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
  greeting: string;
  hideHero?: boolean;
}

export function CreatorDashboardView({
  data: initialData,
  careerOsEnabled = false,
  greeting,
  hideHero = false,
}: Props) {
  const creatorId = initialData.context.creator.id;
  const userId = initialData.context.creator.owner_id;

  const { data: liveData } = useCreatorDashboardSrtspLive({
    creatorId,
    userId,
    initialData,
  });

  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (liveData) setData(liveData);
  }, [liveData]);

  const {
    context,
    hero,
    revenueStats,
    activities,
    assistantTips,
    goals,
    careerOs,
    profileCreatedAt,
    paymentConfigured,
  } = data;

  const kpiItems = useMemo(() => buildDashboardKpiBand(data), [data]);

  const stack = (
    <div className="creator-dashboard__stack">
      <DashboardKpiBand items={kpiItems} />

      <DashboardCoachCard
        tips={assistantTips}
        goals={goals}
        careerLevelLabel={careerOsEnabled ? careerOs.level.label : undefined}
        careerLevelIcon={careerOsEnabled ? careerOs.level.icon : undefined}
      />

      <DashboardWalletCard
        revenueStats={revenueStats}
        paymentConfigured={paymentConfigured}
        activities={activities}
      />

      <DashboardPremiumCard />
    </div>
  );

  if (hideHero) {
    return (
      <>
        <WelcomeModal
          stageName={context.artistProfile.stage_name}
          profileCreatedAt={profileCreatedAt}
        />
        {stack}
      </>
    );
  }

  return (
    <div className="creator-dashboard">
      <WelcomeModal
        stageName={context.artistProfile.stage_name}
        profileCreatedAt={profileCreatedAt}
      />

      <HeroCard
        hero={hero}
        artistProfile={context.artistProfile}
        creator={context.creator}
        profileCreatedAt={profileCreatedAt}
        greeting={greeting}
      />

      {stack}
    </div>
  );
}
