import type { ISRCValue } from "@sonafrik/types";
import { ISRCReservationFailedError, PublicationValidationFailedError } from "../errors";
import type { PublicationPipelineStepHandler } from "../pipeline/pipeline-state";
import { validateISRCValue } from "../validators";
import type { MetadataApplicationPorts } from "../../metadata/application/ports";
/** Creator-scoped ISRC reservation — no admin gate, ownership enforced upstream */
export async function reserveIsrcForPublication(
  ports: MetadataApplicationPorts,
  actorId: string,
  correlationId: string,
  isrc: string,
): Promise<string> {
  const value = validateISRCValue(isrc) as ISRCValue;
  try {
    await ports.repositories.isrc.reserve(value, actorId, {
      actorId,
      correlationId,
      initiatedAt: new Date().toISOString(),
    });
    return isrc;
  } catch {
    throw new ISRCReservationFailedError("Reservation ISRC impossible");
  }
}

export function createIsrcReservationStep(
  ports: MetadataApplicationPorts,
): PublicationPipelineStepHandler {
  return {
    stepId: "isrc-reservation",
    order: 4,
    async execute(state) {
      const proposed =
        state.request.proposedIsrc ??
        `GNSFK${String(new Date().getFullYear()).slice(-2)}00001`;
      if (!/^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/.test(proposed)) {
        throw new PublicationValidationFailedError("Format ISRC proposé invalide");
      }

      if (state.config.isrcReservation) {
        const reserved = await reserveIsrcForPublication(
          ports,
          state.ctx.actorId,
          state.ctx.correlationId,
          proposed,
        );
        return { ...state, reservedIsrc: reserved, isrcSimulated: false };
      }

      return { ...state, simulatedIsrc: proposed, isrcSimulated: true };
    },
    async rollback(state) {
      state.simulatedIsrc = null;
      state.reservedIsrc = null;
      state.isrcSimulated = false;
    },
  };
}

export function createCatalogSubmitStep(): PublicationPipelineStepHandler {
  return {
    stepId: "catalog-submit",
    order: 8,
    async execute(state) {
      if (state.config.realPublish && state.legacySubmit) {
        await state.legacySubmit();
      }
      return state;
    },
    async rollback() {
      /* legacy RPC is idempotent guard — no automatic undo */
    },
  };
}
