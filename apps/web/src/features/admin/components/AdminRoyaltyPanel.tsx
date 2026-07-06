"use client";

import { OVERLAY } from "@/lib/design/overlayTokens";
import { useState, useCallback } from "react";
import type { RoyaltyCycle } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { triggerRoyaltyCycleAction } from "../actions/admin.actions";

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  initialCycles: RoyaltyCycle[];
}

export function AdminRoyaltyPanel({ initialCycles }: Props) {
  const [cycles, setCycles] = useState<RoyaltyCycle[]>(initialCycles);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalRevenueGnf, setTotalRevenueGnf] = useState(100_000);

  const handleTrigger = useCallback(async () => {
    if (!confirm("Déclencher un cycle royalties ? Les artistes éligibles seront crédités.")) return;

    setIsTriggering(true);
    setError(null);
    setSuccess(null);

    const result = await triggerRoyaltyCycleAction({
      periodStart: monthStartIso(),
      periodEnd: todayIso(),
      totalRevenueGnf,
      revenuePoolPercent: 65,
    });

    setIsTriggering(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(
      `Cycle ${result.cycleId?.slice(0, 8)}… — ${result.artistCount ?? 0} artiste(s), ${formatGnf(result.totalDistributed ?? 0)} distribués.`,
    );

    setCycles((prev) => [
      {
        id: result.cycleId ?? crypto.randomUUID(),
        period_start: monthStartIso(),
        period_end: todayIso(),
        status: "distributed",
        total_valid_listens: 0,
        total_revenue_gnf: totalRevenueGnf,
        revenue_pool_gnf: totalRevenueGnf * 0.65,
        revenue_pool_percent: 65,
        artist_count: result.artistCount ?? 0,
        distributed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [totalRevenueGnf]);

  return (
    <section
      className="rounded-xl p-5 space-y-4"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}
    >
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          Cycles royalties
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-texte-secondaire)" }}>
          Calcule et distribue les royalties pour la période courante (65% du pool revenus).
        </p>
      </div>

      <div className="space-y-2">
        {cycles.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
            Aucun cycle encore déclenché. Le premier cycle alimentera wallet_ledger.
          </p>
        ) : (
          cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-elevated)" }}
            >
              <span style={{ color: "var(--color-texte-principal)" }}>
                {cycle.period_start} → {cycle.period_end}
              </span>
              <span style={{ color: "var(--color-texte-secondaire)" }}>{cycle.status}</span>
              <span style={{ color: "var(--color-vert-energie)" }}>
                {formatGnf(cycle.revenue_pool_gnf)} pool
              </span>
            </div>
          ))
        )}
      </div>

      <label className="block text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
        Revenus totaux période (GNF)
        <input
          type="number"
          min={1000}
          step={1000}
          value={totalRevenueGnf}
          onChange={(e) => setTotalRevenueGnf(Number(e.target.value))}
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--color-elevated)",
            border: "1px solid var(--color-bordure)",
            color: "var(--color-texte-principal)",
          }}
        />
      </label>

      {error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: OVERLAY.erreurSoft, color: "var(--color-erreur)" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: OVERLAY.vertSoft, color: "var(--color-vert-energie)" }}>
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleTrigger()}
        disabled={isTriggering}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
      >
        {isTriggering ? "Calcul en cours…" : "▶ Déclencher un cycle royalties"}
      </button>

      <p className="text-xs" style={{ color: "var(--color-avertissement)" }}>
        Action sensible : vérifiez les écoutes valides de la période avant de déclencher.
      </p>
    </section>
  );
}
