/** Étapes officielles du pipeline SRTSP — Phase 2.2 certification. */
export const SRTSP_PIPELINE_STAGES = {
  TRANSPORT_INBOUND: "transport.inbound",
  NORMALIZER_MAPPED: "normalizer.mapped",
  NORMALIZER_SKIPPED: "normalizer.skipped",
  GUARD_VALIDATED: "guard.validated",
  REGISTRY_VALIDATED: "registry.validated",
  REGISTRY_CONTRACT: "registry.contract",
  DEDUPE_ACCEPTED: "dedupe.accepted",
  DEDUPE_DROPPED: "dedupe.dropped",
  OFFLINE_BUFFERED: "offline.buffered",
  BUS_DELIVER_START: "bus.deliver.start",
  BUS_DELIVERED: "bus.delivered",
  DISPATCHER_NOTIFIED: "dispatcher.notified",
} as const;

export type SrtspPipelineStage = (typeof SRTSP_PIPELINE_STAGES)[keyof typeof SRTSP_PIPELINE_STAGES];

export const PIPELINE_TRACE_CODE = "PIPELINE_TRACE";
