"use client";

import { useCallback, useId, useState } from "react";
import {
  ANALYTICS_PERIOD_PRESETS,
  type AnalyticsCustomRange,
  type AnalyticsPeriodId,
} from "../lib/analyticsPeriod";

interface Props {
  value: AnalyticsPeriodId;
  customRange: AnalyticsCustomRange | null;
  onChange: (periodId: AnalyticsPeriodId, customRange?: AnalyticsCustomRange | null) => void;
  loading?: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  return d.toISOString().slice(0, 10);
}

export function AnalyticsPeriodPicker({ value, customRange, onChange, loading }: Props) {
  const [showCustom, setShowCustom] = useState(value === "custom");
  const [draftStart, setDraftStart] = useState(customRange?.start ?? "");
  const [draftEnd, setDraftEnd] = useState(customRange?.end ?? "");
  const customPanelId = useId();

  const openCustomPanel = useCallback(() => {
    setShowCustom((open) => {
      if (!open) {
        setDraftStart(customRange?.start ?? daysAgoIso(30));
        setDraftEnd(customRange?.end ?? todayIso());
      }
      return !open;
    });
  }, [customRange]);

  const applyCustom = useCallback(() => {
    if (draftStart > draftEnd) return;
    const span =
      Math.ceil((new Date(draftEnd).getTime() - new Date(draftStart).getTime()) / 86_400_000) + 1;
    if (span > 90 || span < 1) return;
    onChange("custom", { start: draftStart, end: draftEnd });
    setShowCustom(false);
  }, [draftStart, draftEnd, onChange]);

  return (
    <div className="analytics-period" role="group" aria-label="Période d'analyse">
      <div className="analytics-period__pills">
        {ANALYTICS_PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`analytics-period__pill${value === preset.id ? " analytics-period__pill--active" : ""}`}
            onClick={() => {
              setShowCustom(false);
              onChange(preset.id, null);
            }}
            disabled={loading}
            aria-pressed={value === preset.id}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          className={`analytics-period__pill${value === "custom" ? " analytics-period__pill--active" : ""}`}
          onClick={openCustomPanel}
          disabled={loading}
          aria-expanded={showCustom}
          aria-controls={customPanelId}
          aria-pressed={value === "custom"}
        >
          Personnalisé
        </button>
      </div>

      {showCustom && (
        <div id={customPanelId} className="analytics-period__custom">
          <label className="analytics-period__custom-field">
            <span>Du</span>
            <input
              type="date"
              value={draftStart}
              max={draftEnd}
              onChange={(e) => setDraftStart(e.target.value)}
            />
          </label>
          <label className="analytics-period__custom-field">
            <span>Au</span>
            <input
              type="date"
              value={draftEnd}
              min={draftStart}
              max={todayIso()}
              onChange={(e) => setDraftEnd(e.target.value)}
            />
          </label>
          <button type="button" className="analytics-period__apply" onClick={applyCustom}>
            Appliquer
          </button>
          <p className="analytics-period__hint">Maximum 90 jours</p>
        </div>
      )}
    </div>
  );
}
