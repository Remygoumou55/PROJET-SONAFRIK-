/**
 * SONAFRIK — Upload Policy Enterprise
 * Types pour les événements du cycle de vie d'un upload.
 *
 * Ces types sont conçus pour être utilisés avec un event emitter, un état React,
 * ou un système de telemetry — mais ne connectent rien en Phase 1.1.
 * La connexion aux composants se fera en Phase 2+.
 */

import type {
  UploadContext,
  UploadErrorCategory,
  UploadErrorCode,
  UploadEventType,
} from "./enums";

// ─── Événements individuels ───────────────────────────────────────────────────

export interface UploadStartedEvent {
  readonly type: UploadEventType.STARTED;
  readonly context: UploadContext;
  readonly filename: string;
  readonly size: number;
  readonly mime: string;
  readonly timestamp: number;
}

export interface UploadProgressEvent {
  readonly type: UploadEventType.PROGRESS;
  readonly context: UploadContext;
  readonly progress: number;
  readonly bytesUploaded: number;
  readonly bytesTotal: number;
  readonly timestamp: number;
}

export interface UploadCompletedEvent {
  readonly type: UploadEventType.COMPLETED;
  readonly context: UploadContext;
  readonly path: string;
  readonly size: number;
  readonly duration: number;
  readonly timestamp: number;
}

export interface UploadFailedEvent {
  readonly type: UploadEventType.FAILED;
  readonly context: UploadContext;
  readonly errorCode: UploadErrorCode;
  readonly errorCategory: UploadErrorCategory;
  readonly message: string;
  readonly timestamp: number;
}

export interface UploadCancelledEvent {
  readonly type: UploadEventType.CANCELLED;
  readonly context: UploadContext;
  readonly timestamp: number;
}

export interface UploadRetryEvent {
  readonly type: UploadEventType.RETRY;
  readonly context: UploadContext;
  readonly attempt: number;
  readonly timestamp: number;
}

// ─── Union discriminée ────────────────────────────────────────────────────────

/** Union discriminée de tous les événements d'upload — utilisable en switch/type guard */
export type UploadEvent =
  | UploadStartedEvent
  | UploadProgressEvent
  | UploadCompletedEvent
  | UploadFailedEvent
  | UploadCancelledEvent
  | UploadRetryEvent;
