"use client";

import { useMemo, useState } from "react";
import type { AdminFraudSession } from "@sonafrik/api/admin";
import { formatDateTime } from "@/lib/formatters";

interface Props {
  sessions: AdminFraudSession[];
}

const FLAG_LABELS: Record<string, string> = {
  seek_abuse: "Seek abusif",
  too_fast: "Vitesse anormale",
  repeated_start: "Redémarrages répétés",
  duplicate_session: "Session dupliquée",
  bot_pattern: "Pattern bot",
};

export function AdminFraudCenter({ sessions }: Props) {
  const textMain = "var(--color-texte-principal)";
  const textSub = "var(--color-texte-secondaire)";
  const cardBg = "var(--color-card)";
  const border = "var(--color-elevated)";

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.started_at) return true;
      const date = s.started_at.slice(0, 10);
      if (filterFrom && date < filterFrom) return false;
      if (filterTo && date > filterTo) return false;
      return true;
    });
  }, [sessions, filterFrom, filterTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: textMain }}>Sessions Fraude</h1>
        <p className="mt-1 text-sm" style={{ color: textSub }}>
          Sessions avec au moins un flag anti-fraude levé — {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""}{filteredSessions.length !== sessions.length ? ` / ${sessions.length} total` : ""}
        </p>
      </div>

      {/* Filtre plage de dates */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: textSub }}>Du</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs outline-none"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}`, color: textMain, colorScheme: "dark" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: textSub }}>Au</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs outline-none"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}`, color: textMain, colorScheme: "dark" }}
          />
        </div>
        {(filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterFrom(""); setFilterTo(""); }}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: "var(--color-elevated)", color: textSub }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filteredSessions.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: cardBg }}>
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm" style={{ color: textSub }}>
            Aucune session suspecte détectée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {s.fraud_flags.map((flag) => (
                      <span
                        key={flag}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "rgba(255,68,68,0.13)", color: "var(--color-erreur)" }}
                      >
                        {FLAG_LABELS[flag] ?? flag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs font-mono" style={{ color: "var(--color-texte-desactive)" }}>
                    Session {s.id.slice(0, 8)}… · Track {s.track_id.slice(0, 8)}…
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                    User {s.user_id.slice(0, 8)}… · {s.platform} · {s.started_at ? formatDateTime(s.started_at) : "—"}
                  </p>
                  {s.ip_address && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-texte-desactive)" }}>
                      IP: {s.ip_address}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: s.is_valid_listen ? "var(--color-vert-energie)" : "var(--color-erreur)" }}
                  >
                    {s.listen_percentage.toFixed(0)}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                    {s.total_listened_seconds}s / {s.total_duration_seconds}s
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: s.is_valid_listen ? "var(--color-vert-energie)" : "var(--color-erreur)" }}
                  >
                    {s.is_valid_listen ? "Valide" : "Invalide"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
