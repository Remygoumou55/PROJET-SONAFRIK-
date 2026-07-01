"use client";

import Link from "next/link";
import type { CreatorDashboardData, CreatorTopTrack } from "@sonafrik/types";
import { HeroCard } from "../dashboard/components/HeroCard";
import { GlanceKpiGrid } from "../dashboard/components/enterprise/GlanceKpiGrid";
import { WelcomeModal } from "../dashboard/components/WelcomeModal";
import { CreatorAssetImage } from "../dashboard/components/CreatorAssetImage";
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

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

function WalletCard({ balanceGnf }: { balanceGnf: number }) {
  return (
    <div className="co-card co-card--wallet">
      <p className="co-card-label">💳 Solde disponible</p>
      <p className="co-wallet-value">{fmtGnf(balanceGnf)}</p>
      {balanceGnf > 0 ? (
        <Link href="/creator/analytics" className="co-wallet-btn">
          Retirer mes gains →
        </Link>
      ) : (
        <p className="co-empty-hint">
          Tes gains apparaîtront ici après tes premières écoutes validées.
        </p>
      )}
    </div>
  );
}

function TopTrackCard({
  track,
  creatorId,
}: {
  track: CreatorTopTrack;
  creatorId: string;
}) {
  return (
    <div className="co-card">
      <p className="co-card-label">🔥 Ton morceau le plus écouté</p>
      <div className="co-top-track-row">
        <div className="co-top-track-cover">
          {track.cover_path ? (
            <CreatorAssetImage
              creatorId={creatorId}
              path={track.cover_path}
              assetKind="cover"
              alt={track.title}
              layout="bounded"
              className="co-top-track-img"
            />
          ) : (
            <span className="co-top-track-icon" aria-hidden="true">🎵</span>
          )}
        </div>
        <div className="co-top-track-meta">
          <p className="co-top-track-title">{track.title}</p>
          <p className="co-top-track-streams">
            {fmtNum(track.valid_streams)} écoute{track.valid_streams !== 1 ? "s" : ""} valide{track.valid_streams !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function NoTrackCard() {
  return (
    <div className="co-card">
      <p className="co-card-label">🎵 Mon catalogue</p>
      <p className="co-empty-hint">Aucun morceau publié pour le moment.</p>
      <Link href="/creator/catalog/tracks" className="co-cta">
        + Publier mon premier morceau
      </Link>
    </div>
  );
}

function WeekCard({
  streamsThisWeek,
  revenueMonthGnf,
}: {
  streamsThisWeek: number;
  revenueMonthGnf: number;
}) {
  return (
    <div className="co-card">
      <p className="co-card-label">📅 Cette semaine</p>
      <div className="co-week-stats">
        <div className="co-week-stat">
          <p className="co-week-val">{fmtNum(streamsThisWeek)}</p>
          <p className="co-week-lbl">Écoutes valides</p>
        </div>
        <div className="co-week-sep" aria-hidden="true" />
        <div className="co-week-stat">
          <p className="co-week-val">{fmtGnf(revenueMonthGnf)}</p>
          <p className="co-week-lbl">Revenus ce mois</p>
        </div>
      </div>
    </div>
  );
}

export function CreatorDashboardView({ data }: Props) {
  const { context, hero, streamStats, revenueStats, topTrack, catalogCounts, profileCreatedAt } = data;
  const creatorId = context.creator.id;
  const validTopTrack =
    topTrack && isValidContentName(topTrack.title) ? topTrack : null;
  const hasPublished = catalogCounts.tracksPublished > 0;

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

      <div className="co-bottom-row">
        <WalletCard balanceGnf={revenueStats.wallet_balance_gnf} />

        {validTopTrack ? (
          <TopTrackCard track={validTopTrack} creatorId={creatorId} />
        ) : (
          <NoTrackCard />
        )}

        <WeekCard
          streamsThisWeek={streamStats.valid_week_streams}
          revenueMonthGnf={revenueStats.estimated_monthly_gnf}
        />
      </div>

      {!hasPublished && (
        <div className="co-onboard-banner">
          <span className="co-onboard-icon" aria-hidden="true">🚀</span>
          <div>
            <p className="co-onboard-title">Prêt à publier ?</p>
            <p className="co-onboard-sub">
              Uploade ton premier morceau et commence à accumuler des écoutes.
            </p>
          </div>
          <Link href="/creator/catalog/tracks" className="co-cta">
            + Uploader
          </Link>
        </div>
      )}
    </div>
  );
}
