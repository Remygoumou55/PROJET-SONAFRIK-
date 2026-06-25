/** Official publication workflow — flag-driven (Phase 5) */

export const PUBLICATION_WORKFLOW_STEPS = [
  "verify-context",
  "resolve-metadata",
  "validate-metadata",
  "isrc-reservation",
  "build-publication-package",
  "validate-dependencies",
  "prepare-persistence",
  "catalog-submit",
] as const;

export type PublicationWorkflowStepId = (typeof PUBLICATION_WORKFLOW_STEPS)[number];

export const FUTURE_PIPELINE_HOOKS = [
  "upc",
  "fingerprint",
  "distribution",
  "royalties",
  "audit",
] as const;
