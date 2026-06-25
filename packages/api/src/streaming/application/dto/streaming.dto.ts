export interface RuntimeStatusDto {
  readonly mode: "legacy" | "runtime" | "dry_run";
  readonly runtimeEnabled: boolean;
  readonly applicationLayerEnabled: boolean;
  readonly registeredHandlers: readonly string[];
}

export interface SessionStateDto {
  readonly sessionId: string;
  readonly state: import("@sonafrik/types").SessionStateId | "not_found" | "legacy";
  readonly message: string;
}

export interface CommandDispatchDto {
  readonly accepted: boolean;
  readonly mode: "legacy" | "runtime" | "dry_run";
  readonly commandType: string;
  readonly message: string;
}
