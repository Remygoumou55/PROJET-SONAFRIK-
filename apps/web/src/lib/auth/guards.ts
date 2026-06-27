import {
  assertBypassForbiddenOnVercel,
  DEV_MOCK_USER_ID,
  isClientLocalControlMode,
  isDevBypassActive,
  isLocalControlMode,
} from "@sonafrik/shared/auth";

export {
  assertBypassForbiddenOnVercel,
  DEV_MOCK_USER_ID,
  isClientLocalControlMode,
  isDevBypassActive,
  isLocalControlMode,
};

/** Middleware — court-circuit total en mode Live Control (pas de redirect auth/home). */
export function isMiddlewareBypassActive(): boolean {
  return isLocalControlMode();
}
