"use client";

import { useState } from "react";
import type {
  WorkWithDetails,
  ContributorRole,
  OwnershipType,
  ContractType,
} from "@sonafrik/types";
import {
  CONTRIBUTOR_ROLE_LABELS,
  OWNERSHIP_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  RIGHTS_CLAIM_STATUS_LABELS,
  RIGHTS_CLAIM_TYPE_LABELS,
} from "@sonafrik/types";

interface Props {
  work: WorkWithDetails;
  creatorId: string;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-elevated)",
  borderRadius: "1rem",
  padding: "1.25rem",
};

const sectionTitle: React.CSSProperties = {
  color: "var(--color-texte-desactive)",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.75rem",
};

function Badge({ label, color = "var(--color-texte-desactive)" }: { label: string; color?: string }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

export function WorkDetail({ work, creatorId }: Props) {
  const [activeTab, setActiveTab] = useState<"contributors" | "contracts" | "claims">("contributors");
  const _ = creatorId; // reserved for future mutations

  const totalShare = work.contributors.reduce((acc, c) => {
    return acc + c.ownerships.reduce((s, o) => s + o.share_percent, 0);
  }, 0);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "contributors", label: `Contributeurs (${work.contributors.length})` },
    { key: "contracts",    label: `Contrats (${work.contracts.length})` },
    { key: "claims",       label: `Revendications (${work.claims.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Work header */}
      <div style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-texte-principal)" }}>{work.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {work.iswc && (
                <span className="text-xs font-mono" style={{ color: "var(--color-texte-desactive)" }}>
                  ISWC {work.iswc}
                </span>
              )}
              {work.genre && <Badge label={work.genre} color="var(--color-texte-secondaire)" />}
              <Badge label={work.language.toUpperCase()} color="var(--color-texte-desactive)" />
            </div>
            {work.description && (
              <p className="text-sm mt-2" style={{ color: "var(--color-texte-secondaire)" }}>{work.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>Parts déclarées</p>
            <p
              className="text-2xl font-black tabular-nums"
              style={{ color: totalShare >= 100 ? "var(--color-vert-energie)" : "var(--color-or-solaire)" }}
            >
              {totalShare.toFixed(0)}%
            </p>
            {totalShare < 100 && (
              <p className="text-xs mt-0.5" style={{ color: "var(--color-or-solaire)" }}>
                {(100 - totalShare).toFixed(0)}% non attribuées
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-elevated)" }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderColor: activeTab === key ? "var(--color-vert-energie)" : "transparent",
              color: activeTab === key ? "var(--color-vert-energie)" : "var(--color-texte-desactive)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contributors panel */}
      {activeTab === "contributors" && (
        <div className="space-y-3">
          <p style={sectionTitle}>Répartition des droits</p>
          {work.contributors.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}>
              <p className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
                Aucun contributeur enregistré. Ajoutez des ayants-droit via l&apos;API ou l&apos;interface à venir.
              </p>
            </div>
          ) : (
            work.contributors.map((c) => {
              const masterShare = c.ownerships
                .filter((o) => o.ownership_type === "master")
                .reduce((s, o) => s + o.share_percent, 0);
              return (
                <div key={c.id} style={cardStyle}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                        {c.display_name}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge
                          label={CONTRIBUTOR_ROLE_LABELS[c.role as ContributorRole] ?? c.role}
                          color="var(--color-vert-energie)"
                        />
                        {c.ipi && (
                          <span className="text-xs font-mono" style={{ color: "var(--color-texte-desactive)" }}>
                            IPI {c.ipi}
                          </span>
                        )}
                      </div>
                    </div>
                    {masterShare > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold tabular-nums" style={{ color: "var(--color-or-solaire)" }}>
                          {masterShare.toFixed(1)}%
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                          {OWNERSHIP_TYPE_LABELS["master" as OwnershipType]}
                        </p>
                      </div>
                    )}
                  </div>
                  {c.ownerships.filter((o) => o.ownership_type !== "master").map((o) => (
                    <div key={o.id} className="flex justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--color-elevated)" }}>
                      <span className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>
                        {OWNERSHIP_TYPE_LABELS[o.ownership_type as OwnershipType] ?? o.ownership_type}
                        {o.territory !== "worldwide" ? ` — ${o.territory}` : ""}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--color-or-solaire)" }}>
                        {o.share_percent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Contracts panel */}
      {activeTab === "contracts" && (
        <div className="space-y-3">
          {work.contracts.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}>
              <p className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
                Aucun contrat enregistré pour cette œuvre.
              </p>
            </div>
          ) : (
            work.contracts.map((c) => (
              <div key={c.id} style={cardStyle}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                      {c.counterparty_name}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge
                        label={CONTRACT_TYPE_LABELS[c.contract_type as ContractType] ?? c.contract_type}
                        color="var(--color-or-solaire)"
                      />
                      {c.signed_at && <Badge label="Signé" color="var(--color-vert-energie)" />}
                    </div>
                    {c.start_date && (
                      <p className="text-xs mt-1.5" style={{ color: "var(--color-texte-desactive)" }}>
                        {c.start_date}{c.end_date ? ` → ${c.end_date}` : " → sans terme"}
                      </p>
                    )}
                  </div>
                  {c.revenue_share_percent != null && (
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums" style={{ color: "var(--color-or-solaire)" }}>
                        {c.revenue_share_percent}%
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>revenue share</p>
                    </div>
                  )}
                </div>
                {c.terms && (
                  <p className="text-xs mt-2 pt-2 line-clamp-2" style={{ color: "var(--color-texte-secondaire)", borderTop: "1px solid var(--color-elevated)" }}>
                    {c.terms}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Claims panel */}
      {activeTab === "claims" && (
        <div className="space-y-3">
          {work.claims.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}>
              <p className="text-sm" style={{ color: "var(--color-texte-desactive)" }}>
                Aucune revendication sur cette œuvre.
              </p>
            </div>
          ) : (
            work.claims.map((cl) => {
              const statusColor =
                cl.status === "accepted" ? "var(--color-vert-energie)" :
                cl.status === "rejected" ? "var(--color-erreur)" :
                cl.status === "escalated" ? "var(--color-or-solaire)" : "var(--color-texte-secondaire)";
              return (
                <div key={cl.id} style={cardStyle}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-texte-principal)" }}>
                        {RIGHTS_CLAIM_TYPE_LABELS[cl.claim_type] ?? cl.claim_type}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
                        {cl.description}
                      </p>
                    </div>
                    <Badge
                      label={RIGHTS_CLAIM_STATUS_LABELS[cl.status] ?? cl.status}
                      color={statusColor}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
