"use client";

import { memo } from "react";
import type { AdminFraudIncident } from "@sonafrik/api/admin";
import { formatDateTime } from "@/lib/formatters";
import {
  buildIncidentHeadline,
  SEVERITY_META,
} from "../../lib/fraud/humanizeFraudIncident";
import { countryLabel, parseDeviceLabel } from "../../lib/fraud/fraudDisplayHelpers";
import type { FraudIncidentAdminState } from "../../lib/fraud/fraudIncidentStore";
import { FraudIncidentMenu, type FraudMenuAction } from "./FraudIncidentMenu";

interface Props {
  incident: AdminFraudIncident;
  adminState: FraudIncidentAdminState | null;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  menuActions: FraudMenuAction[];
}

function FraudIncidentCardView({
  incident,
  adminState,
  selected,
  onToggleSelect,
  onOpen,
  menuActions,
}: Props) {
  const headline = buildIncidentHeadline(incident.fraud_flags, incident.is_valid_listen);
  const severity = SEVERITY_META[headline.severity];
  const device = parseDeviceLabel(incident.user_agent, incident.platform);

  return (
    <article
      className={`fraud-incident-card ${severity.cssClass}${adminState?.treated ? " fraud-incident-card--treated" : ""}${adminState?.archived ? " fraud-incident-card--archived" : ""}`}
    >
      <div className="fraud-incident-card__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Sélectionner l'incident ${headline.title}`}
        />
      </div>

      <button type="button" className="fraud-incident-card__main" onClick={onOpen}>
        <div className="fraud-incident-card__top">
          <span className={`fraud-severity-badge ${severity.cssClass}`}>
            {severity.emoji} {severity.label}
          </span>
          {adminState?.treated ? <span className="fraud-incident-card__tag">Traité</span> : null}
          {adminState?.archived ? <span className="fraud-incident-card__tag">Archivé</span> : null}
        </div>

        <h3 className="fraud-incident-card__title">
          {headline.emoji} {headline.title}
        </h3>
        <p className="fraud-incident-card__sentence">{headline.summary}</p>

        <div className="fraud-incident-card__meta">
          <span>{incident.user_name ?? "Auditeur"}</span>
          <span aria-hidden>·</span>
          <span>{incident.track_title ?? "Morceau"}</span>
          {incident.artist_name ? (
            <>
              <span aria-hidden>·</span>
              <span>{incident.artist_name}</span>
            </>
          ) : null}
        </div>

        <div className="fraud-incident-card__footer">
          <time dateTime={incident.started_at}>{formatDateTime(incident.started_at)}</time>
          <span>{countryLabel(incident.user_country)}</span>
          <span>{device}</span>
          {incident.ip_address ? <span>{incident.ip_address}</span> : null}
          <span className={incident.is_valid_listen ? "fraud-incident-card__ok" : "fraud-incident-card__ko"}>
            {incident.is_valid_listen ? "Écoute valide" : "Écoute rejetée"}
          </span>
        </div>
      </button>

      <FraudIncidentMenu actions={menuActions} />
    </article>
  );
}

export const FraudIncidentCard = memo(FraudIncidentCardView);
