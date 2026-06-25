import { describe, expect, it } from "vitest";
import {
  ApplicationLayerDisabledError,
  RuntimeContextInvalidError,
  RuntimeDisabledError,
  RuntimeHandlerNotRegisteredError,
  RuntimeNotAuthorizedError,
  RuntimeNotImplementedError,
  RuntimeTransitionRejectedError,
  StreamingRuntimeError,
} from "./runtime.errors";

describe("runtime-errors", () => {
  it("exposes error codes", () => {
    const error = new StreamingRuntimeError("RUNTIME_DISABLED", "test");
    expect(error.code).toBe("RUNTIME_DISABLED");
    expect(new RuntimeDisabledError().code).toBe("RUNTIME_DISABLED");
    expect(new ApplicationLayerDisabledError().code).toBe("APPLICATION_LAYER_DISABLED");
    expect(new RuntimeContextInvalidError().code).toBe("CONTEXT_INVALID");
    expect(new RuntimeNotAuthorizedError().code).toBe("NOT_AUTHORIZED");
    expect(new RuntimeTransitionRejectedError().code).toBe("TRANSITION_REJECTED");
    expect(new RuntimeHandlerNotRegisteredError("OpenSession").code).toBe("HANDLER_NOT_REGISTERED");
    expect(new RuntimeNotImplementedError("x").code).toBe("NOT_IMPLEMENTED");
    expect(new RuntimeDisabledError("ports").code).toBe("RUNTIME_DISABLED");
  });
});
