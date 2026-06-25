import type { MetadataContext, PersistenceContext } from "@sonafrik/types";
import { NotAuthorizedError } from "../errors";

/** Zero Trust application context — required on every use case */
export interface ApplicationContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly initiatedAt?: string;
  readonly isAdmin?: boolean;
  readonly idempotencyKey?: string;
}

export function toPersistenceContext(ctx: ApplicationContext): PersistenceContext {
  return {
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    initiatedAt: ctx.initiatedAt ?? new Date().toISOString(),
  };
}

export function toMetadataContext(ctx: ApplicationContext): MetadataContext {
  return {
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    initiatedAt: ctx.initiatedAt ?? new Date().toISOString(),
    locale: "fr-GN",
    attributes: {},
  };
}

export function assertActor(ctx: ApplicationContext): void {
  if (!ctx.actorId?.trim()) {
    throw new NotAuthorizedError("actorId requis");
  }
}

export function assertAdmin(ctx: ApplicationContext): void {
  if (!ctx.isAdmin) {
    throw new NotAuthorizedError("Accès administrateur requis");
  }
}
