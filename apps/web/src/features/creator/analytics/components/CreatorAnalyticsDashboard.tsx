"use client";

import { useMemo, useState } from "react";
import type { CreatorAnalyticsData } from "@sonafrik/types";
import { useCreatorAnalyticsSrtspLive } from "../hooks/useCreatorAnalyticsSrtspLive";
import { useAnalyticsTimelineForPeriod } from "../hooks/useAnalyticsTimelineForPeriod";
import { AnalyticsPeriodPicker } from "./AnalyticsPeriodPicker";
import { AnalyticsSummaryKpis } from "./AnalyticsSummaryKpis";
import { AnalyticsStreamChart } from "./AnalyticsStreamChart";
import { AnalyticsTopTracks } from "./AnalyticsTopTracks";
import { AnalyticsTopAlbums } from "./AnalyticsTopAlbums";
import { AnalyticsDetailsPanel } from "./AnalyticsDetailsPanel";
import {
  buildAnalyticsStory,
  computePeriodTrend,
  DEFAULT_ANALYTICS_PERIOD,
  getPresetById,
  resolvePeriodAudience,
  resolvePeriodRevenue,
  resolvePeriodStreams,
  type AnalyticsCustomRange,
  type AnalyticsPeriodId,
} from "../lib/analyticsPeriod";

interface Props {
  data: CreatorAnalyticsData;
  creatorId: string;
}

export function CreatorAnalyticsDashboard({ data: initialData, creatorId }: Props) {
  const [periodId, setPeriodId] = useState<AnalyticsPeriodId>(DEFAULT_ANALYTICS_PERIOD);
  const [customRange, setCustomRange] = useState<AnalyticsCustomRange | null>(null);

  const { data: liveData } = useCreatorAnalyticsSrtspLive({
    creatorId,
    initialData,
  });

  const baseData = liveData ?? initialData;

  const { timeline, loading: timelineLoading } = useAnalyticsTimelineForPeriod({
    creatorId,
    periodId,
    customRange,
    initialTimeline: baseData.timeline,
  });

  const data = useMemo(
    () => ({ ...baseData, timeline }),
    [baseData, timeline],
  );

  const periodLabel = useMemo(() => {
    if (periodId === "custom" && customRange) {
      return `${customRange.start} → ${customRange.end}`;
    }
    return getPresetById(periodId).label;
  }, [periodId, customRange]);

  const streams = resolvePeriodStreams(data.streamStats, periodId, data.timeline, customRange);
  const trend = computePeriodTrend(data.timeline, periodId, customRange);
  const audience = resolvePeriodAudience(data.audienceStats, periodId);
  const revenue = resolvePeriodRevenue(data.revenueStats, periodId, streams);
  const story = buildAnalyticsStory(data, periodId, customRange);

  function handlePeriodChange(next: AnalyticsPeriodId, range?: AnalyticsCustomRange | null) {
    setPeriodId(next);
    setCustomRange(range ?? null);
  }

  return (
    <div className="analytics-page">
      <header className="analytics-page__header">
        <div>
          <h1 className="analytics-page__title">Tes stats</h1>
          <p className="analytics-page__story">{story}</p>
        </div>
        <AnalyticsPeriodPicker
          value={periodId}
          customRange={customRange}
          onChange={handlePeriodChange}
          loading={timelineLoading}
        />
      </header>

      <AnalyticsSummaryKpis
        streams={streams}
        trend={trend}
        estimatedGnf={revenue.estimated}
        walletBalance={revenue.balance}
        newFollowers={audience.newFollowers}
        totalFollowers={audience.totalFollowers}
        audienceLabel={audience.label}
      />

      <AnalyticsStreamChart
        entries={data.timeline}
        periodId={periodId}
        customRange={customRange}
        periodLabel={periodLabel}
      />

      <div className="analytics-page__rankings">
        <AnalyticsTopTracks tracks={data.topTracks} />
        <AnalyticsTopAlbums albums={data.topAlbums} />
      </div>

      <AnalyticsDetailsPanel data={data} />
    </div>
  );
}
