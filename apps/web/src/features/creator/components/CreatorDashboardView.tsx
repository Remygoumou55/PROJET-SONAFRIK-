"use client";
import Link from "next/link";
import type { CreatorDashboardData } from "@sonafrik/types";
import { DashboardPanel } from "@/features/shared/dashboard";
import { GlanceKpiGrid } from "../dashboard/components/enterprise/GlanceKpiGrid";
import { useCreatorDashboardSrtspLive } from "../dashboard/hooks/useCreatorDashboardSrtspLive";
import { DashboardCatalogueCard } from "../dashboard/components/DashboardCatalogueCard";
import { DashboardCareerProgressCard } from "../dashboard/components/DashboardCareerProgressCard";
import { DashboardPremiumCard } from "../dashboard/components/DashboardPremiumCard";
import { HeroCard } from "../dashboard/components/HeroCard";
import { isValidContentName } from "@/lib/content-filter";
import dynamic from "next/dynamic";

const WelcomeModal = dynamic(
  () => import("../dashboard/components/WelcomeModal").then((m) => ({ default: m.WelcomeModal })),
  { ssr: false },
);

const DashboardCoachCard = dynamic(
  () =>
    import("../dashboard/components/DashboardCoachCard").then((m) => ({
      default: m.DashboardCoachCard,
    })),
  {
    loading: () => (
      <div className="dashboard-panel dashboard-panel--coach animate-pulse" style={{ minHeight: "12rem" }} aria-hidden="true" />
    ),
  },
);

interface Props {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
  greeting: string;
  hideHero?: boolean;
}

function fmtGnf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GNF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k GNF`;
  return `${n.toLocaleString("fr-FR")} GNF`;
}

function WalletCard({ balanceGnf }: { balanceGnf: number }) {
  return (
    <DashboardPanel className="dashboard-panel--wallet" ariaLabel="Solde disponible">
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
    </DashboardPanel>
  );
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

  const data = liveData ?? initialData;
  const { context, hero, revenueStats, topTrack, catalogCounts, activities, assistantTips, careerOs, profileCreatedAt } =
    data;

  const validTopTrack = topTrack && isValidContentName(topTrack.title) ? topTrack : null;

  const stack = (
    <div className="creator-dashboard__stack">
      <GlanceKpiGrid data={data} />

      <WalletCard balanceGnf={revenueStats.wallet_balance_gnf} />

      <DashboardCatalogueCard
        topTrack={validTopTrack}
        tracksPublished={catalogCounts.tracksPublished}
        creatorId={creatorId}
      />

      <div className={careerOsEnabled ? "dash-bottom-2col" : ""}>
        {careerOsEnabled ? <DashboardCareerProgressCard careerOs={careerOs} /> : null}
        <DashboardCoachCard
          tips={assistantTips}
          activities={activities}
          profilePercent={hero.profilePercent}
          careerLevelLabel={careerOsEnabled ? careerOs.level.label : undefined}
          careerLevelIcon={careerOsEnabled ? careerOs.level.icon : undefined}
        />
      </div>

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
