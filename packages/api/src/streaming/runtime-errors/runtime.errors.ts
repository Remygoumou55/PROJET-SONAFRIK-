/** Runtime foundation errors — distinct from legacy StreamingError */
export class StreamingRuntimeError extends Error {
  readonly code: StreamingRuntimeErrorCode;

  constructor(code: StreamingRuntimeErrorCode, message: string) {
    super(message);
    this.name = "StreamingRuntimeError";
    this.code = code;
  }
}

export type StreamingRuntimeErrorCode =
  | "RUNTIME_DISABLED"
  | "APPLICATION_LAYER_DISABLED"
  | "CONTRACTS_DISABLED"
  | "PORTS_DISABLED"
  | "EVENTS_DISABLED"
  | "CONTEXT_INVALID"
  | "NOT_AUTHORIZED"
  | "TRANSITION_REJECTED"
  | "HANDLER_NOT_REGISTERED"
  | "NOT_IMPLEMENTED"
  | "LEGACY_DELEGATION_REQUIRED";

export class RuntimeDisabledError extends StreamingRuntimeError {
  constructor(message = "Streaming Runtime désactivé — utiliser le chemin legacy") {
    super("RUNTIME_DISABLED", message);
    this.name = "RuntimeDisabledError";
  }
}

export class ApplicationLayerDisabledError extends StreamingRuntimeError {
  constructor(message = "Couche Application Runtime désactivée") {
    super("APPLICATION_LAYER_DISABLED", message);
    this.name = "ApplicationLayerDisabledError";
  }
}

export class RuntimeContextInvalidError extends StreamingRuntimeError {
  constructor(message = "Runtime Context invalide") {
    super("CONTEXT_INVALID", message);
    this.name = "RuntimeContextInvalidError";
  }
}

export class RuntimeNotAuthorizedError extends StreamingRuntimeError {
  constructor(message = "Accès non autorisé au Runtime") {
    super("NOT_AUTHORIZED", message);
    this.name = "RuntimeNotAuthorizedError";
  }
}

export class RuntimeTransitionRejectedError extends StreamingRuntimeError {
  constructor(message = "Transition refusée par la state machine") {
    super("TRANSITION_REJECTED", message);
    this.name = "RuntimeTransitionRejectedError";
  }
}

export class RuntimeHandlerNotRegisteredError extends StreamingRuntimeError {
  constructor(handlerName: string) {
    super("HANDLER_NOT_REGISTERED", `Handler non enregistré : ${handlerName}`);
    this.name = "RuntimeHandlerNotRegisteredError";
  }
}

export class RuntimeNotImplementedError extends StreamingRuntimeError {
  constructor(feature: string) {
    super("NOT_IMPLEMENTED", `Non implémenté — prévu Sprint 2.2+ : ${feature}`);
    this.name = "RuntimeNotImplementedError";
  }
}
