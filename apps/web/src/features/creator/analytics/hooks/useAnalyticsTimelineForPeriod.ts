"use client";

import { useCallback, useEffect, useState } from "react";
import type { StreamTimelineEntry } from "@sonafrik/types";
import { useAnalyticsServices } from "./useAnalytics";
import {
  DEFAULT_ANALYTICS_PERIOD,
  getTimelineDaysForPeriod,
  type AnalyticsCustomRange,
  type AnalyticsPeriodId,
} from "../lib/analyticsPeriod";

interface Params {
  creatorId: string;
  periodId: AnalyticsPeriodId;
  customRange: AnalyticsCustomRange | null;
  initialTimeline: StreamTimelineEntry[];
}

export function useAnalyticsTimelineForPeriod({
  creatorId,
  periodId,
  customRange,
  initialTimeline,
}: Params) {
  const { analytics } = useAnalyticsServices();
  const [timeline, setTimeline] = useState(initialTimeline);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTimeline(initialTimeline);
  }, [initialTimeline]);

  const fetchTimeline = useCallback(async () => {
    if (periodId === DEFAULT_ANALYTICS_PERIOD && !customRange) {
      setTimeline(initialTimeline);
      return;
    }

    setLoading(true);
    try {
      const days = getTimelineDaysForPeriod(periodId, customRange);
      const next = await analytics.getStreamTimeline({ creatorId, days });
      setTimeline(next);
    } catch {
      setTimeline(initialTimeline);
    } finally {
      setLoading(false);
    }
  }, [analytics, creatorId, periodId, customRange, initialTimeline]);

  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  return { timeline, loading };
}
