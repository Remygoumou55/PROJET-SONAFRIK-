"use client";

import { useId, useState } from "react";
import type { CreatorAnalyticsData } from "@sonafrik/types";
import { RoyaltyHistoryCard } from "./RoyaltyHistoryCard";
import { formatGnf } from "@sonafrik/shared";

interface Props {
  data: CreatorAnalyticsData;
}

export function AnalyticsDetailsPanel({ data }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const { streamStats, audienceStats, revenueStats } = data;

  return (
    <section className="analytics-details">
      <button
        type="button"
        className="analytics-details__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Masquer les détails" : "Voir plus de détails"}
        <span className="analytics-details__chevron" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div id={panelId} className="analytics-details__panel">
          <div className="analytics-details__grid">
            <div className="analytics-details__block">
              <h3 className="analytics-details__heading">Audience détaillée</h3>
              <ul className="analytics-details__rows">
                <li><span>Abonnés artiste</span><strong>{audienceStats.artist_followers.toLocaleString("fr-FR")}</strong></li>
                <li><span>Likes morceaux</span><strong>{audienceStats.total_track_likes.toLocaleString("fr-FR")}</strong></li>
                <li><span>Favoris albums</span><strong>{audienceStats.total_album_favorites.toLocaleString("fr-FR")}</strong></li>
                <li><span>Playlists</span><strong>{audienceStats.playlist_followers.toLocaleString("fr-FR")}</strong></li>
                <li><span>Engagement</span><strong>{audienceStats.engagement_score.toLocaleString("fr-FR")}</strong></li>
              </ul>
            </div>

            <div className="analytics-details__block">
              <h3 className="analytics-details__heading">Revenus détaillés</h3>
              <ul className="analytics-details__rows">
                <li><span>Total versé</span><strong>{formatGnf(revenueStats.paid_royalties_gnf)}</strong></li>
                <li><span>En attente</span><strong>{formatGnf(revenueStats.pending_royalties_gnf)}</strong></li>
                <li><span>Total crédité</span><strong>{formatGnf(revenueStats.total_credited_gnf)}</strong></li>
                <li><span>Moyenne / écoute</span><strong>{revenueStats.avg_gnf_per_listen > 0 ? `${revenueStats.avg_gnf_per_listen.toFixed(4)} GNF` : "—"}</strong></li>
                <li><span>Écoutes filtrées</span><strong>{streamStats.fraud_streams.toLocaleString("fr-FR")}</strong></li>
              </ul>
            </div>
          </div>

          <RoyaltyHistoryCard history={data.royaltyHistory} />

          <p className="analytics-details__geo">
            Géographie — bientôt disponible. Nous n&apos;affichons pas encore la localisation de vos auditeurs.
          </p>
        </div>
      )}
    </section>
  );
}
