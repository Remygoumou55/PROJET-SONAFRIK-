"use client";

import { memo } from "react";
import { REVENUE_POOL_PERCENT } from "@sonafrik/types";
import { useRoyalties } from "../hooks/useWallet";

export const RoyaltiesPage = memo(function RoyaltiesPage() {
  const { royalties, isLoading } = useRoyalties();

  const totalNet = royalties.reduce((sum, r) => sum + r.net_amount_gnf, 0);
  const totalListens = royalties.reduce((sum, r) => sum + r.valid_listen_count, 0);

  return (
    <div className="space-y-6">
      {/* Info revenue pool */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "#1F1F1F", border: "1px solid #FFC20E33" }}>
        <p className="text-sm font-medium" style={{ color: "#FFC20E" }}>Revenue Pool Artistes</p>
        <p className="text-3xl font-bold mt-1" style={{ color: "#FFFFFF" }}>{REVENUE_POOL_PERCENT}%</p>
        <p className="text-xs mt-1" style={{ color: "#A0A0A0" }}>
          {REVENUE_POOL_PERCENT}% des revenus d&apos;abonnement sont redistribués aux artistes selon leur part d&apos;écoutes valides.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: "#1F1F1F" }}>
          <p className="text-sm font-medium" style={{ color: "#A0A0A0" }}>Total gagné</p>
          <p className="text-xl font-bold mt-1" style={{ color: "#00D26A" }}>
            {new Intl.NumberFormat("fr-GN").format(Math.round(totalNet))} GNF
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "#1F1F1F" }}>
          <p className="text-sm font-medium" style={{ color: "#A0A0A0" }}>Écoutes valides</p>
          <p className="text-xl font-bold mt-1" style={{ color: "#FFFFFF" }}>
            {new Intl.NumberFormat("fr-GN").format(totalListens)}
          </p>
        </div>
      </div>

      {/* Historique par cycle */}
      {isLoading ? (
        <div className="py-8 text-center" style={{ color: "#555555" }}>Chargement…</div>
      ) : royalties.length === 0 ? (
        <div className="py-10 text-center rounded-xl" style={{ backgroundColor: "#1F1F1F" }}>
          <p className="text-2xl mb-2">🎵</p>
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            Aucune royaltie. Publiez et faites écouter votre musique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {royalties.map((r) => (
            <div key={r.id} className="rounded-xl p-4" style={{ backgroundColor: "#1F1F1F" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
                    {new Intl.NumberFormat("fr-GN").format(Math.round(r.net_amount_gnf))} GNF net
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#A0A0A0" }}>
                    {r.valid_listen_count} écoutes · {r.listen_share_percent.toFixed(4)}% du pool
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: r.status === "paid" ? "#00D26A22" : "#FFC20E22",
                    color: r.status === "paid" ? "#00D26A" : "#FFC20E",
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
