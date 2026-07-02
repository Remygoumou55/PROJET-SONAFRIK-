"use client";

import Link from "next/link";
import type { CreatorDashboardData } from "@sonafrik/types";
import { HeroCard } from "../dashboard/components/HeroCard";
import { GlanceKpiGrid } from "../dashboard/components/enterprise/GlanceKpiGrid";
import { WelcomeModal } from "../dashboard/components/WelcomeModal";
import { DashboardCatalogueCard } from "../dashboard/components/DashboardCatalogueCard";
import { DashboardCareerProgressCard } from "../dashboard/components/DashboardCareerProgressCard";
import { DashboardCoachCard } from "../dashboard/components/DashboardCoachCard";
import { DashboardPremiumCard } from "../dashboard/components/DashboardPremiumCard";
import { isValidContentName } from "@/lib/content-filter";

interface Props {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
}

function fmtGnf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GNF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k GNF`;
  return `${n.toLocaleString("fr-FR")} GNF`;
}

function WalletCard({ balanceGnf }: { balanceGnf: number }) {
  return (
    <div className="co-card co-card--wallet">
      <p className="co-card-label">💳 Solde disponible</p>
      <p className="co-wallet-value">{fmtGnf(balanceGnf)}</p>
      <p className="co-wallet-retirable">Retirable maintenant</p>
      {balanceGnf > 0 ? (
        <Link href="/wallet" className="co-wallet-btn">
          Retirer mes gains
        </Link>
      ) : (
        <p className="co-empty-hint">
          Tes gains apparaîtront ici après tes premières écoutes validées.
        </p>
      )}
    </div>
  );
}

export function CreatorDashboardView({ data }: Props) {
  const { context, hero, revenueStats, topTrack, catalogCounts, activities, assistantTips, careerOs, profileCreatedAt } = data;
  const creatorId = context.creator.id;

  const validTopTrack = topTrack && isValidContentName(topTrack.title) ? topTrack : null;

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
      />

      <GlanceKpiGrid data={data} />

      <WalletCard balanceGnf={revenueStats.wallet_balance_gnf} />

      <DashboardCatalogueCard
        topTrack={validTopTrack}
        tracksPublished={catalogCounts.tracksPublished}
        creatorId={creatorId}
      />

      <div className="dash-bottom-2col">
        <DashboardCareerProgressCard careerOs={careerOs} />
        <DashboardCoachCard tips={assistantTips} activities={activities} />
      </div>

      <DashboardPremiumCard />
    </div>
  );
}
