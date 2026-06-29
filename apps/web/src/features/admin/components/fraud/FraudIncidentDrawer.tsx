"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdminFraudIncident, AdminFraudStreamEvent } from "@sonafrik/api/admin";
import { formatDateTime } from "@/lib/formatters";
import { loadFraudSessionEventsAction } from "../../actions/admin-fraud.actions";
import {
  buildIncidentHeadline,
  buildIncidentDecisionAid,
  humanizeFraudFlags,
  SEVERITY_META,
} from "../../lib/fraud/humanizeFraudIncident";
import { countryLabel, parseDeviceLabel } from "../../lib/fraud/fraudDisplayHelpers";
import type { FraudIncidentAdminState } from "../../lib/fraud/fraudIncidentStore";
import { FraudIncidentTimeline } from "./FraudIncidentTimeline";

interface Props {
  incident: AdminFraudIncident | null;
  adminState: FraudIncidentAdminState | null;
  open: boolean;
  onClose: () => void;
  onMarkTreated: () => void;
  onArchive: () => void;
  onHide: () => void;
  onAddNote: (note: string) => void;
}

function FraudIncidentDrawerView({
  incident,
  adminState,
  open,
  onClose,
  onMarkTreated,
  onArchive,
  onHide,
  onAddNote,
}: Props) {
  const [events, setEvents] = useState<AdminFraudStreamEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open || !incident) return;
    const sessionId = incident.id;
    setLoadingEvents(true);
    void loadFraudSessionEventsAction(sessionId)
      .then(setEvents)
      .finally(() => setLoadingEvents(false));
  }, [open, incident]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open || !incident) return null;

  const headline = buildIncidentHeadline(incident.fraud_flags, incident.is_valid_listen);
  const severity = SEVERITY_META[headline.severity];
  const decision = buildIncidentDecisionAid(
    incident.fraud_flags,
    incident.is_valid_listen,
    incident.listen_percentage,
  );
  const flags = humanizeFraudFlags(incident.fraud_flags);
  const device = parseDeviceLabel(incident.user_agent, incident.platform);

  return (
    <div className="fraud-drawer-backdrop" onClick={handleBackdrop} role="presentation">
      <aside
        ref={panelRef}
        className="fraud-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fraud-drawer-title"
      >
        <header className="fraud-drawer__header">
          <div>
            <span className={`fraud-severity-badge ${severity.cssClass}`}>
              {severity.emoji} {severity.label}
            </span>
            <h2 id="fraud-drawer-title" className="fraud-drawer__title">
              {headline.emoji} {headline.title}
            </h2>
            <p className="fraud-drawer__summary">{headline.summary}</p>
          </div>
          <button type="button" className="fraud-drawer__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <div className="fraud-drawer__body">
          <section className="fraud-drawer__section fraud-drawer__decision-aid">
            <h3 className="fraud-drawer__section-title">Aide à la décision</h3>
            <div className="fraud-decision-aid">
              <div className="fraud-decision-aid__confidence">
                <span className="fraud-decision-aid__confidence-label">Confiance moteur</span>
                <strong>{decision.confidencePercent} %</strong>
              </div>
              <dl className="fraud-decision-aid__dl">
                <div>
                  <dt>Pourquoi</dt>
                  <dd>{decision.why}</dd>
                </div>
                <div>
                  <dt>Impact</dt>
                  <dd>{decision.impact}</dd>
                </div>
                <div>
                  <dt>Analyse</dt>
                  <dd>{decision.analysis}</dd>
                </div>
                <div>
                  <dt>Action recommandée</dt>
                  <dd className="fraud-decision-aid__action">{decision.recommendedAction}</dd>
                </div>
                <div>
                  <dt>Niveau métier</dt>
                  <dd className="fraud-decision-aid__tier">{decision.businessTier}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="fraud-drawer__section">
            <h3 className="fraud-drawer__section-title">Résumé</h3>
            <dl className="fraud-drawer__dl">
              <div>
                <dt>Date</dt>
                <dd>{formatDateTime(incident.started_at)}</dd>
              </div>
              <div>
                <dt>Progression</dt>
                <dd>
                  {incident.listen_percentage.toFixed(0)}% · {incident.total_listened_seconds}s /{" "}
                  {incident.total_duration_seconds}s
                </dd>
              </div>
              <div>
                <dt>Statut écoute</dt>
                <dd>{incident.is_valid_listen ? "✅ Écoute valide" : "❌ Non retenue"}</dd>
              </div>
              {adminState?.treated ? (
                <div>
                  <dt>Traitement</dt>
                  <dd>✓ Marqué traité</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="fraud-drawer__section">
            <h3 className="fraud-drawer__section-title">Signaux détectés</h3>
            <ul className="fraud-drawer__flags">
              {flags.map((f) => (
                <li key={f.code}>
                  {f.emoji} <strong>{f.label}</strong> — {f.sentence}
                </li>
              ))}
            </ul>
          </section>

          <section className="fraud-drawer__section">
            <h3 className="fraud-drawer__section-title">Personnes & contenu</h3>
            <dl className="fraud-drawer__dl">
              <div>
                <dt>Auditeur</dt>
                <dd>{incident.user_name ?? "Auditeur"}</dd>
              </div>
              <div>
                <dt>Artiste</dt>
                <dd>{incident.artist_name ?? "—"}</dd>
              </div>
              <div>
                <dt>Morceau</dt>
                <dd>{incident.track_title ?? "—"}</dd>
              </div>
              {incident.album_title ? (
                <div>
                  <dt>Album</dt>
                  <dd>{incident.album_title}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="fraud-drawer__section">
            <h3 className="fraud-drawer__section-title">Contexte technique</h3>
            <dl className="fraud-drawer__dl">
              <div>
                <dt>Adresse IP</dt>
                <dd>{incident.ip_address ?? "Non disponible"}</dd>
              </div>
              <div>
                <dt>Pays</dt>
                <dd>{countryLabel(incident.user_country)}</dd>
              </div>
              <div>
                <dt>Appareil</dt>
                <dd>{device}</dd>
              </div>
              <div>
                <dt>Plateforme</dt>
                <dd>{incident.platform}</dd>
              </div>
            </dl>
          </section>

          <section className="fraud-drawer__section">
            <h3 className="fraud-drawer__section-title">Chronologie</h3>
            {loadingEvents ? (
              <p className="fraud-drawer__loading">Chargement de l&apos;historique…</p>
            ) : (
              <FraudIncidentTimeline
                events={events}
                startedAt={incident.started_at}
                flags={incident.fraud_flags}
                isValidListen={incident.is_valid_listen}
              />
            )}
          </section>

          <section className="fraud-drawer__section">
            <h3 className="fraud-drawer__section-title">Commentaires admin</h3>
            {adminState?.notes.length ? (
              <ul className="fraud-drawer__notes">
                {adminState.notes.map((n, i) => (
                  <li key={`${i}-${n.slice(0, 12)}`}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="fraud-drawer__empty-note">Aucune note pour cet incident.</p>
            )}
            <div className="fraud-drawer__note-form">
              <input
                type="text"
                className="fraud-drawer__note-input"
                placeholder="Ajouter une note interne…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => {
                  onAddNote(noteDraft);
                  setNoteDraft("");
                }}
              >
                Ajouter
              </button>
            </div>
          </section>
        </div>

        <footer className="fraud-drawer__footer">
          <Link href={`/admin/users`} className="admin-btn admin-btn-ghost admin-btn-sm">
            Voir l&apos;auditeur
          </Link>
          {incident.track_id ? (
            <Link href={`/listen/track/${incident.track_id}`} className="admin-btn admin-btn-ghost admin-btn-sm">
              Voir le morceau
            </Link>
          ) : null}
          <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={onMarkTreated}>
            Marquer traité
          </button>
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onArchive}>
            Archiver
          </button>
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onHide}>
            Masquer
          </button>
        </footer>
      </aside>
    </div>
  );
}

export const FraudIncidentDrawer = memo(FraudIncidentDrawerView);
