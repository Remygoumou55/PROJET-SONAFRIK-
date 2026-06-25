import type { MetadataErrorCode } from "@sonafrik/types";
import { METADATA_ERROR_MESSAGES } from "@sonafrik/types";

/** Base error for the Metadata Engine domain */
export abstract class MetadataError extends Error {
  abstract readonly code: MetadataErrorCode;

  protected constructor(code: MetadataErrorCode, message?: string) {
    super(message ?? METADATA_ERROR_MESSAGES[code]);
    this.name = "MetadataError";
  }
}

export class ValidationError extends MetadataError {
  readonly code = "validation_failed" as const;

  constructor(message?: string) {
    super("validation_failed", message);
    this.name = "ValidationError";
  }
}

export class GenerationError extends MetadataError {
  readonly code = "generation_failed" as const;

  constructor(message?: string) {
    super("generation_failed", message);
    this.name = "GenerationError";
  }
}

export class DuplicateError extends MetadataError {
  readonly code = "duplicate_detected" as const;

  constructor(message?: string) {
    super("duplicate_detected", message);
    this.name = "DuplicateError";
  }
}

export class RegistryError extends MetadataError {
  readonly code = "registry_conflict" as const;

  constructor(message?: string) {
    super("registry_conflict", message);
    this.name = "RegistryError";
  }
}

export class PipelineError extends MetadataError {
  readonly code = "pipeline_aborted" as const;

  constructor(message?: string) {
    super("pipeline_aborted", message);
    this.name = "PipelineError";
  }
}

export class StorageError extends MetadataError {
  readonly code = "storage_unavailable" as const;

  constructor(message?: string) {
    super("storage_unavailable", message);
    this.name = "StorageError";
  }
}

export class PublicationError extends MetadataError {
  readonly code = "publication_blocked" as const;

  constructor(message?: string) {
    super("publication_blocked", message);
    this.name = "PublicationError";
  }
}
