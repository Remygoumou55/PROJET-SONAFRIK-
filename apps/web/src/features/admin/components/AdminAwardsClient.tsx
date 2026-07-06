"use client";

import { useMemo, useState } from "react";
import type { AdminAwardsDashboard } from "@sonafrik/api/admin";
import { formatGnf } from "@sonafrik/shared";
import { isValidContentName } from "@/lib/content-filter";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import {
  adminCloseAwardVotesAction,
  adminDistributeAwardPrizesAction,
} from "../actions/admin-sprint5.actions";
import { useAdminAwardsSrtspLive } from "../hooks/useAdminAwardsSrtspLive";
import { useAdminActionRunner } from "../hooks/useAdminActionRunner";

type TabKey = "edition" | "config" | "fund" | "history";

function fmtGnf(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GNF`;
  return formatGnf(n);
}

export function AdminAwardsClient({ data: initialData }: { data: AdminAwardsDashboard }) {
  const live = useAdminAwardsSrtspLive({ initialData });
  const data = live.data ?? initialData;

  const [activeTab, setActiveTab] = useState<TabKey>("edition");
  const { error, isPending, run } = useAdminActionRunner();

  const totalPrizes = data.categories.reduce((s, c) => s + Number(c.prize_amount_gnf ?? 0), 0);
  const fundCoversPrizes = data.fundBalance >= totalPrizes;

  const filteredNomineesByCategory = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(data.nomineesByCategory).map(([cat, nominees]) => [
          cat,
          nominees
            .filter((n) => isValidContentName(n.stageName))
            .sort((a, b) => b.voteCount - a.voteCount),
        ]),
      ),
    [data.nomineesByCategory],
  );

  const handleCloseVotes = async () => {
    if (!data.activeEdition?.id) return;
    await run(() => adminCloseAwardVotesAction({ editionId: data.activeEdition!.id }), {
      ldseEvent: { type: ADMIN_LDSE_EVENTS.snapshotInvalidate },
    });
  };

  const handleDistributePrizes = async () => {
    if (!data.activeEdition?.id) return;
    await run(
      () =>
        adminDistributeAwardPrizesAction({
          editionId: data.activeEdition!.id,
          adminNote: "Versement déclenché depuis le back-office",
        }),
      { ldseEvent: { type: ADMIN_LDSE_EVENTS.snapshotInvalidate } },
    );
  };

  return (
    <div className="admin-dashboard admin-awards-module">
      <div className="admin-page-header">
        <div className="admin-analytics-header-row">
          <div>
            <h1 className="admin-page-title">🏆 SONAFRIK Awards</h1>
            <p className="admin-page-sub">Programme de récompenses musicales</p>
          </div>
          {data.activeEdition && (
            <div className="admin-live-indicator">
              <span className="admin-live-dot" />
              <span>
                Édition {data.activeEdition.year} —{" "}
                {data.activeEdition.status === "active" ? "Votes ouverts" : data.activeEdition.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="admin-inline-error">{error}</p>}

      <div className="admin-kpis-grid admin-kpis-grid--4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header"><span className="admin-kpi-icon" aria-hidden>🏆</span></div>
          <p className="admin-kpi-value">{data.categories.length}</p>
          <p className="admin-kpi-title">Catégories</p>
          <p className="admin-kpi-sub">actives cette édition</p>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-header"><span className="admin-kpi-icon" aria-hidden>🎤</span></div>
          <p className="admin-kpi-value">{data.totalNominees}</p>
          <p className="admin-kpi-title">Nominés</p>
          <p className="admin-kpi-sub">toutes catégories</p>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-header"><span className="admin-kpi-icon" aria-hidden>💰</span></div>
          <p className={`admin-kpi-value${data.fundBalance > 0 ? " admin-kpi-value--ok" : " admin-kpi-value--warn"}`}>
            {fmtGnf(data.fundBalance)}
          </p>
          <p className="admin-kpi-title">Fonds Awards</p>
          <p className="admin-kpi-sub">disponible pour les prix</p>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-header"><span className="admin-kpi-icon" aria-hidden>🎁</span></div>
          <p className="admin-kpi-value">{fmtGnf(totalPrizes)}</p>
          <p className="admin-kpi-title">Total des prix</p>
          <p className="admin-kpi-sub">à distribuer</p>
        </div>
      </div>

      <div className="admin-tabs">
        {(
          [
            { key: "edition", label: "🗳️ Édition en cours" },
            { key: "config", label: "⚙️ Configuration" },
            { key: "fund", label: "💰 Fonds Awards" },
            { key: "history", label: "📜 Historique" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "edition" && (
        <div>
          {!data.activeEdition ? (
            <div className="admin-card admin-card--centered">
              <span className="admin-empty-icon" aria-hidden>🏆</span>
              <p className="admin-empty">Aucune édition Awards active.</p>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => setActiveTab("config")}>
                ⚙️ Configurer une édition
              </button>
            </div>
          ) : (
            <>
              <div className="admin-card admin-card--spaced">
                <div className="awards-edition-header">
                  <div>
                    <h3 className="admin-card-title">SONAFRIK Awards {data.activeEdition.year}</h3>
                    <div className="awards-edition-meta">
                      {data.activeEdition.votes_open_at && (
                        <span>📅 Ouverture : {new Date(data.activeEdition.votes_open_at).toLocaleDateString("fr-FR")}</span>
                      )}
                      {data.activeEdition.votes_close_at && (
                        <span>🔒 Fermeture : {new Date(data.activeEdition.votes_close_at).toLocaleDateString("fr-FR")}</span>
                      )}
                      {data.activeEdition.ceremony_date && (
                        <span>🎊 Cérémonie : {new Date(data.activeEdition.ceremony_date).toLocaleDateString("fr-FR")}</span>
                      )}
                    </div>
                  </div>
                  <div className="awards-edition-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      disabled={isPending || data.activeEdition.status !== "active"}
                      onClick={handleCloseVotes}
                    >
                      🔒 Fermer les votes
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      disabled={isPending || data.activeEdition.status !== "votes_closed"}
                      onClick={handleDistributePrizes}
                    >
                      {isPending ? "⏳ Versement..." : "🎁 Verser les prix"}
                    </button>
                  </div>
                </div>
              </div>

              {Object.entries(filteredNomineesByCategory).map(([category, nominees]) =>
                nominees.length === 0 ? null : (
                  <div key={category} className="admin-card admin-card--spaced">
                    <div className="awards-category-header">
                      <h3 className="admin-card-title">🏆 {category}</h3>
                      <span className="awards-prize-label">Prix : {fmtGnf(nominees[0]?.prizeAmountGnf ?? 0)}</span>
                    </div>
                    {nominees.map((nominee, idx) => {
                      const currentVotes = nominee.voteCount;
                      const maxVotes = Math.max(...nominees.map((n) => n.voteCount), 1);
                      const pct = (currentVotes / maxVotes) * 100;
                      const isLeading = idx === 0;
                      return (
                        <div
                          key={nominee.id}
                          className={`awards-nominee-row${isLeading ? " awards-nominee-row--leading" : ""}`}
                        >
                          <span className="awards-rank">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                          </span>
                          <div className="awards-avatar" aria-hidden>🎤</div>
                          <div className="awards-nominee-body">
                            <div className="awards-nominee-top">
                              <p className="awards-nominee-name">{nominee.stageName}</p>
                              <span className="awards-vote-count">
                                {currentVotes.toLocaleString("fr-FR")} votes
                              </span>
                            </div>
                            <div className="awards-vote-bar">
                              <div
                                className={`awards-vote-fill${isLeading ? " awards-vote-fill--gold" : ""}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <span className="awards-score">
                            {nominee.scoreCalculated ?? "—"}/100
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ),
              )}

              {Object.keys(filteredNomineesByCategory).length === 0 && (
                <div className="admin-card">
                  <p className="admin-empty">Aucun nominé enregistré pour cette édition.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "config" && (
        <div className="admin-card">
          <h3 className="admin-card-title">Configuration Awards</h3>
          <p className="admin-empty">
            {data.activeEdition
              ? `Édition ${data.activeEdition.year} — poids écoutes ${data.activeEdition.score_streams_weight}% / votes ${data.activeEdition.score_votes_weight}%`
              : "Créez une édition active en base pour activer la configuration complète."}
          </p>
          {data.categories.map((cat) => (
            <div key={cat.id} className="admin-field-config">
              <span className="admin-field-config-label">🏆 {cat.name}</span>
              <span className="awards-config-amount">{fmtGnf(Number(cat.prize_amount_gnf))}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "fund" && (
        <>
          <div className="admin-kpis-grid admin-kpis-grid--3">
            <div className="admin-kpi-card">
              <p className={`admin-kpi-value${data.fundBalance > 0 ? " admin-kpi-value--ok" : " admin-kpi-value--warn"}`}>
                {fmtGnf(data.fundBalance)}
              </p>
              <p className="admin-kpi-title">Solde actuel du fonds</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-value">{fmtGnf(totalPrizes)}</p>
              <p className="admin-kpi-title">Total prix à verser</p>
            </div>
            <div className={`admin-kpi-card${!fundCoversPrizes ? " admin-kpi-card--alert" : ""}`}>
              <p className={`admin-kpi-value${fundCoversPrizes ? " admin-kpi-value--ok" : " admin-kpi-value--warn"}`}>
                {fundCoversPrizes ? "OK" : "DÉFICIT"}
              </p>
              <p className="admin-kpi-title">Couverture des prix</p>
            </div>
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">Historique du fonds</h3>
            {data.fundHistory.length === 0 ? (
              <p className="admin-empty">Aucune entrée de fonds.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-th">Date</th>
                      <th className="admin-th">Type</th>
                      <th className="admin-th">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fundHistory.map((entry, i) => (
                      <tr key={`${entry.created_at}-${i}`} className="admin-tr">
                        <td className="admin-td">{new Date(entry.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="admin-td">
                          <span className={entry.direction === "credit" ? "admin-text-ok" : "admin-text-warn"}>
                            {entry.direction === "credit" ? "↑ Contribution" : "↓ Versement"}
                          </span>
                        </td>
                        <td className={`admin-td admin-td--strong ${entry.direction === "credit" ? "admin-text-ok" : "admin-text-warn"}`}>
                          {entry.direction === "credit" ? "+" : "-"}
                          {fmtGnf(entry.amount_gnf)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="admin-card">
          <h3 className="admin-card-title">Éditions passées</h3>
          {data.pastEditions.length === 0 ? (
            <p className="admin-empty">Aucune édition complétée encore.</p>
          ) : (
            data.pastEditions.map((edition) => (
              <div key={edition.id} className="awards-history-row">
                <div className="awards-history-top">
                  <p className="awards-history-title">SONAFRIK Awards {edition.year}</p>
                  <span className="admin-status-badge badge-active">Complétée</span>
                </div>
                {edition.ceremony_date && (
                  <p className="awards-history-meta">
                    Cérémonie : {new Date(edition.ceremony_date).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
