import type { ApplicationContext } from "../../metadata/application/ports";
import { PublicationNotAuthorizedError } from "../errors";

/** Zero Trust publication context — required on every orchestration */
export interface PublicationContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly initiatedAt?: string;
  readonly isAdmin?: boolean;
  readonly idempotencyKey?: string;
}

export function toApplicationContext(ctx: PublicationContext): ApplicationContext {
  return {
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    initiatedAt: ctx.initiatedAt,
    isAdmin: ctx.isAdmin,
    idempotencyKey: ctx.idempotencyKey,
  };
}

export function assertPublicationActor(ctx: PublicationContext): void {
  if (!ctx.actorId?.trim()) {
    throw new PublicationNotAuthorizedError("actorId requis");
  }
}

export function assertPublicationOwnership(
  ctx: PublicationContext,
  creatorId: string,
): void {
  if (ctx.isAdmin) return;
  if (ctx.actorId !== creatorId) {
    throw new PublicationNotAuthorizedError("Propriétaire requis pour publier");
  }
}
