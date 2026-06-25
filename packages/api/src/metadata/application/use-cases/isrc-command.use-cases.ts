import type { ISRCValue } from "@sonafrik/types";
import { mapPersistenceToApplication } from "../errors";
import { metadataReleasedEvent, metadataReservedEvent } from "../events";
import { toISRCReservationDto } from "../mappers";
import type { ISRCReservationDto } from "../dto";
import type { ApplicationContext, ApplicationEventPublisher, MetadataApplicationPorts } from "../ports";
import { assertActor, assertAdmin, toPersistenceContext } from "../ports";
import { validateISRCValue } from "../validators";
import type { UseCaseDeps } from "./metadata-command.use-cases";

export async function executeReserveISRC(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  isrc: string,
): Promise<ISRCReservationDto> {
  assertActor(ctx);
  assertAdmin(ctx);
  try {
    const value = validateISRCValue(isrc) as ISRCValue;
    const entry = await deps.ports.repositories.isrc.reserve(
      value,
      ctx.actorId,
      toPersistenceContext(ctx),
    );
    await deps.events.publish(metadataReservedEvent(ctx.actorId, ctx.correlationId, isrc));
    return toISRCReservationDto(entry);
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeReleaseISRC(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  isrc: string,
): Promise<ISRCReservationDto> {
  assertActor(ctx);
  assertAdmin(ctx);
  try {
    const value = validateISRCValue(isrc) as ISRCValue;
    const entry = await deps.ports.repositories.isrc.release(value, toPersistenceContext(ctx));
    await deps.events.publish(metadataReleasedEvent(ctx.actorId, ctx.correlationId, isrc));
    return toISRCReservationDto(entry);
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export function createUseCaseDeps(
  ports: MetadataApplicationPorts,
  events: ApplicationEventPublisher,
): UseCaseDeps {
  return { ports, events };
}
