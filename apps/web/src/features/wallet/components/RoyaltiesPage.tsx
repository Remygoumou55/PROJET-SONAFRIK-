"use client";

import { memo } from "react";
import { REVENUE_POOL_PERCENT } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { useRoyalties } from "../hooks/useWallet";

export const RoyaltiesPage = memo(function RoyaltiesPage() {
  const { royalties, isLoading, error } = useRoyalties();

  const totalNet = royalties.reduce((sum, r) => sum + r.net_amount_gnf, 0);
  const totalListens = royalties.reduce((sum, r) => sum + r.valid_listen_count, 0);

  return (
    <div className="space-y-6">
      {/* Info revenue pool */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-card)", border: "1px solid rgba(255,194,14,0.2)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--color-or-solaire)" }}>Revenue Pool Artistes</p>
        <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-texte-principal)" }}>{REVENUE_POOL_PERCENT}%</p>
        <p className="text-xs mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
          {REVENUE_POOL_PERCENT}% des revenus d&apos;abonnement sont redistribués aux artistes selon leur part d&apos;écoutes valides.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--color-texte-secondaire)" }}>Total gagné</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--color-vert-energie)" }}>
            {formatGnf(Math.round(totalNet))}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--color-texte-secondaire)" }}>Écoutes valides</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--color-texte-principal)" }}>
            {new Intl.NumberFormat("fr-GN").format(totalListens)}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid rgba(255,77,79,0.25)",
            color: "var(--color-erreur)",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Historique par cycle */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 70}ms` }}>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                  <div className="h-3 w-48 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                </div>
                <div className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--color-elevated)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? null : royalties.length === 0 ? (
        <div className="py-10 text-center rounded-xl" style={{ backgroundColor: "var(--color-card)" }}>
          <p className="text-2xl mb-2">🎵</p>
          <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
            Aucune royaltie. Publiez et faites écouter votre musique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {royalties.map((r) => (
            <div key={r.id} className="rounded-xl p-4" style={{ backgroundColor: "var(--color-card)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
                    {formatGnf(Math.round(r.net_amount_gnf))} net
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-texte-secondaire)" }}>
                    {r.valid_listen_count} écoutes · {r.listen_share_percent.toFixed(4)}% du pool
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: r.status === "paid" ? "rgba(0,210,106,0.13)" : "rgba(255,194,14,0.13)",
                    color: r.status === "paid" ? "var(--color-vert-energie)" : "var(--color-or-solaire)",
                  }}
                >
                  {r.status === "paid" ? "Payé" : r.status === "approved" ? "Approuvé" : "En attente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
