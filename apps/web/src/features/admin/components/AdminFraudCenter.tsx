"use client";

import { formatDateTime } from "@/lib/formatters";

interface FraudSession {
  id: string;
  user_id: string;
  track_id: string;
  platform: string;
  started_at: string;
  total_listened_seconds: number;
  total_duration_seconds: number;
  listen_percentage: number;
  fraud_flags: string[];
  is_valid_listen: boolean;
  ip_address: string | null;
}

interface Props {
  sessions: FraudSession[];
}

const FLAG_LABELS: Record<string, string> = {
  seek_abuse: "Seek abusif",
  too_fast: "Vitesse anormale",
  repeated_start: "Redémarrages répétés",
  duplicate_session: "Session dupliquée",
  bot_pattern: "Pattern bot",
};

export function AdminFraudCenter({ sessions }: Props) {
  const textMain = "#FFFFFF";
  const textSub = "#A0A0A0";
  const cardBg = "#1F1F1F";
  const border = "#2A2A2A";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: textMain }}>Sessions Fraude</h1>
        <p className="mt-1 text-sm" style={{ color: textSub }}>
          Sessions avec au moins un flag anti-fraude levé — {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: cardBg }}>
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm" style={{ color: textSub }}>
            Aucune session suspecte détectée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
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
                        style={{ backgroundColor: "#FF444422", color: "#FF6666" }}
                      >
                        {FLAG_LABELS[flag] ?? flag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs font-mono" style={{ color: "#555555" }}>
                    Session {s.id.slice(0, 8)}… · Track {s.track_id.slice(0, 8)}…
                  </p>
                  <p className="text-xs" style={{ color: "#555555" }}>
                    User {s.user_id.slice(0, 8)}… · {s.platform} · {s.started_at ? formatDateTime(s.started_at) : "—"}
                  </p>
                  {s.ip_address && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: "#555555" }}>
                      IP: {s.ip_address}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: s.is_valid_listen ? "#00D26A" : "#FF6666" }}
                  >
                    {s.listen_percentage.toFixed(0)}%
                  </p>
                  <p className="text-xs" style={{ color: "#555555" }}>
                    {s.total_listened_seconds}s / {s.total_duration_seconds}s
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: s.is_valid_listen ? "#00D26A" : "#FF6666" }}
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
