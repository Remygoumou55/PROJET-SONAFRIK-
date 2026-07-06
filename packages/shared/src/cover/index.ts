export {
  SmartCoverEngine,
  SmartCoverError,
  SMART_COVER_MIN_DIMENSION,
  SMART_COVER_RECOMMENDED,
  SMART_COVER_OUTPUT_MAX_PX,
  detectSmartCoverOrientation,
  computeCenterSquareCrop,
  resolveSmartCoverAdvisory,
  type SmartCoverOrientation,
  type SmartCoverResult,
} from "./smart-cover-engine";
export { SMART_COVER_MESSAGES, mapCoverErrorToUserMessage } from "./smart-cover-messages";
export type { CoverManualAction } from "./manual-interaction.types";
