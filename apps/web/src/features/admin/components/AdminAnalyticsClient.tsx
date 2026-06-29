"use client";

import { useEffect, useState } from "react";
import type { AdminAnalyticsDashboard } from "@sonafrik/api/admin";
import { isValidContentName } from "@/lib/content-filter";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

type LiveMetrics = {
  activeListeners: number;
  tracksBeingPlayed: number;
  topCityNow: string;
  topTrackNow: string;
  recentStreams: AdminAnalyticsDashboard["recentStreams"];
};

type HealthStatus = AdminAnalyticsDashboard["health"];

function healthColor(status: "ok" | "slow" | "down"): string {
  if (status === "ok") return "var(--color-vert-energie)";
  if (status === "slow") return "var(--color-accent-orange)";
  return "var(--color-erreur)";
}

function healthLabel(status: "ok" | "slow" | "down"): string {
  if (status === "ok") return "✅ OK";
  if (status === "slow") return "⚠️ Lent";
  return "❌ Hors ligne";
}

function formatStreamTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function AdminAnalyticsClient({ initialData }: { initialData: AdminAnalyticsDashboard }) {
  const [live, setLive] = useState<LiveMetrics>({
    activeListeners: initialData.activeListeners,
    tracksBeingPlayed: initialData.tracksBeingPlayed,
    topCityNow: initialData.topCity,
    topTrackNow: initialData.topTrack,
    recentStreams: initialData.recentStreams,
  });
  const [health] = useState<HealthStatus>(initialData.health);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useRealtimeChannel(
    "admin-analytics-live",
    [
      {
        event: "INSERT",
        table: "stream_sessions",
        onEvent: () => {
          setLive((prev) => ({
            ...prev,
            activeListeners: prev.activeListeners + 1,
          }));
          setLastUpdated(new Date());
        },
      },
      {
        event: "UPDATE",
        table: "stream_sessions",
        filter: "completed_at=not.is.null",
        onEvent: () => {
          setLive((prev) => ({
            ...prev,
            activeListeners: Math.max(0, prev.activeListeners - 1),
          }));
          setLastUpdated(new Date());
        },
      },
    ],
    true,
  );

  useEffect(() => {
    setLive({
      activeListeners: initialData.activeListeners,
      tracksBeingPlayed: initialData.tracksBeingPlayed,
      topCityNow: initialData.topCity,
      topTrackNow: initialData.topTrack,
      recentStreams: initialData.recentStreams,
    });
  }, [initialData]);

  const okCount = Object.values(health).filter((h) => h.status === "ok").length;
  const healthScore = okCount * 25;

  const topTracks = initialData.topTracks.filter((t) => isValidContentName(t.title));
  const topArtists = initialData.topArtists.filter((a) => isValidContentName(a.stageName));
  const recentStreams = live.recentStreams.filter((s) => isValidContentName(s.trackTitle));

  return (
    <div className="admin-dashboard admin-analytics-module">
      <div className="admin-page-header">
        <div className="admin-analytics-header-row">
          <div>
            <h1 className="admin-page-title">Analytiques</h1>
            <p className="admin-page-sub">
              Temps réel · Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR")}
            </p>
          </div>
          <div className="admin-live-indicator">
            <span className="admin-live-dot" />
            <span>Live</span>
          </div>
        </div>
      </div>

      <div className="admin-kpis-grid admin-analytics-kpis">
        <div className="admin-kpi-card analytics-live-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>🎧</span>
            <span className="analytics-live-badge">LIVE</span>
          </div>
          <p className="admin-kpi-value admin-kpi-value--live">{live.activeListeners.toLocaleString("fr-FR")}</p>
          <p className="admin-kpi-title">Écoutes actives maintenant</p>
        </div>
        <div className="admin-kpi-card analytics-live-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>🎵</span>
            <span className="analytics-live-badge">LIVE</span>
          </div>
          <p className="admin-kpi-value">{live.tracksBeingPlayed}</p>
          <p className="admin-kpi-title">Morceaux en cours</p>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>📍</span>
          </div>
          <p className="admin-kpi-value admin-kpi-value--compact">{live.topCityNow}</p>
          <p className="admin-kpi-title">Ville la plus active</p>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-icon" aria-hidden>🔥</span>
          </div>
          <p className="admin-kpi-value admin-kpi-value--track">{live.topTrackNow}</p>
          <p className="admin-kpi-title">Morceau le plus écouté</p>
        </div>
      </div>

      <div className="admin-analytics-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">🎧 Flux d&apos;écoutes en direct</h3>
          {recentStreams.length === 0 ? (
            <p className="admin-empty">Aucune écoute en ce moment.</p>
          ) : (
            <div className="analytics-stream-list">
              {recentStreams.map((stream, i) => (
                <div
                  key={`${stream.at}-${stream.trackTitle}-${i}`}
                  className={`analytics-stream-item${i === 0 ? " analytics-stream-item--new" : ""}`}
                >
                  <span className={`analytics-stream-dot${i === 0 ? " analytics-stream-dot--live" : ""}`} />
                  <div className="analytics-stream-body">
                    <p className="analytics-stream-title">{stream.trackTitle}</p>
                    <p className="analytics-stream-meta">
                      {stream.artistName} · {stream.city}
                    </p>
                  </div>
                  <span className="analytics-stream-time">{formatStreamTime(stream.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">🩺 Santé SONAFRIK</h3>
          {(
            [
              ["database", "Base de données"],
              ["storage", "Stockage fichiers"],
              ["payments", "Paiements Mobile"],
              ["streaming", "Streaming audio"],
            ] as const
          ).map(([key, label]) => {
            const data = health[key];
            return (
              <div key={key} className="analytics-health-row">
                <div>
                  <p className="analytics-health-label">{label}</p>
                  <p className="analytics-health-latency">{data.latency}ms</p>
                </div>
                <span className="analytics-health-status" style={{ color: healthColor(data.status) }}>
                  {healthLabel(data.status)}
                </span>
              </div>
            );
          })}

          <div className="analytics-health-score">
            <div className="analytics-health-score-header">
              <span className="analytics-health-score-label">Score global</span>
              <span className="analytics-health-score-value">{healthScore}/100</span>
            </div>
            <div className="analytics-health-score-bar">
              <div className="analytics-health-score-fill" style={{ width: `${healthScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-analytics-tops">
        <div className="admin-card">
          <h3 className="admin-card-title">🎵 Top Morceaux cette semaine</h3>
          {topTracks.length === 0 ? (
            <p className="admin-empty">Pas encore de données cette semaine.</p>
          ) : (
            topTracks.map((track, i) => (
              <div key={track.id} className="analytics-top-row">
                <span className={`analytics-top-rank${i < 3 ? " analytics-top-rank--medal" : ""}`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </span>
                <div className="analytics-top-body">
                  <p className="analytics-top-title">{track.title}</p>
                  <p className="analytics-top-sub">{track.artistName}</p>
                </div>
                <span className="analytics-top-stat">{track.streams.toLocaleString("fr-FR")}</span>
              </div>
            ))
          )}
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">🎤 Top Artistes cette semaine</h3>
          {topArtists.length === 0 ? (
            <p className="admin-empty">Pas encore de données cette semaine.</p>
          ) : (
            topArtists.map((artist, i) => (
              <div key={artist.id} className="analytics-top-row">
                <span className={`analytics-top-rank${i < 3 ? " analytics-top-rank--medal" : ""}`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </span>
                <div className="analytics-top-body">
                  <p className="analytics-top-title">{artist.stageName}</p>
                  <p className="analytics-top-sub">{artist.genre}</p>
                </div>
                <span className="analytics-top-stat">{artist.streams.toLocaleString("fr-FR")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
