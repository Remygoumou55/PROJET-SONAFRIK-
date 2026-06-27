"use client";

import Link from "next/link";
import { memo } from "react";
import type { CreatorDashboardData } from "@sonafrik/types";

function WeeklySonafrikPanelView({ data }: { data: CreatorDashboardData }) {
  const { streamStats, catalogCounts, kpis } = data;
  const followers = kpis.find((k) => k.id === "followers");

  const weeklyItems = [
    {
      id: "streams",
      label: "Écoutes",
      value: streamStats.week_streams.toLocaleString("fr-FR"),
      delta:
        streamStats.valid_week_streams > 0 && streamStats.week_streams > 0
          ? `${Math.round((streamStats.valid_week_streams / streamStats.week_streams) * 100)} % valides`
          : "—",
    },
    {
      id: "tracks",
      label: "Morceaux",
      value: catalogCounts.tracksPublished.toLocaleString("fr-FR"),
      delta: catalogCounts.tracksPublished > 0 ? "Catalogue actif" : "—",
    },
    {
      id: "fans",
      label: "Nouveau fan",
      value: (followers?.numericValue ?? 0).toLocaleString("fr-FR"),
      delta:
        followers?.deltaPercent !== null && followers?.deltaPercent !== undefined
          ? `${followers.deltaPercent > 0 ? "+" : ""}${followers.deltaPercent} %`
          : "—",
    },
  ];

  const showPublishCta = catalogCounts.tracksPublished === 0;

  return (
    <section className="dash-weekly" aria-label="Cette semaine sur SONAFRIK">
      <h2 className="dash-section-title">Cette semaine sur SONAFRIK 🔥</h2>
      <div className="dash-weekly__mini-grid">
        {weeklyItems.map((item) => (
          <article key={item.id} className="dash-weekly__mini">
            <p className="dash-weekly__mini-label">{item.label}</p>
            <p className="dash-weekly__mini-value">{item.value}</p>
            <p className="dash-weekly__mini-delta">{item.delta}</p>
          </article>
        ))}
      </div>
      <article className="dash-weekly__motivation">
        <span className="dash-weekly__crown" aria-hidden="true">
          👑
        </span>
        <div className="dash-weekly__motivation-body">
          <p className="dash-weekly__motivation-title">Votre potentiel est illimité !</p>
          <p className="dash-weekly__motivation-text">
            Chaque artiste sur SONAFRIK a commencé exactement où vous êtes. Votre prochaine
            publication peut tout changer.
          </p>
          {showPublishCta ? (
            <Link href="/creator/catalog/tracks" className="dash-weekly__cta">
              Publier un morceau →
            </Link>
          ) : (
            <Link href="/creator/analytics" className="dash-weekly__cta dash-weekly__cta--outline">
              Voir mes statistiques →
            </Link>
          )}
        </div>
      </article>
    </section>
  );
}

export const WeeklySonafrikPanel = memo(WeeklySonafrikPanelView);
