import { describe, expect, it } from "vitest";
import { createRuntimeContext, assertRuntimeContext } from "./streaming-runtime-context";
import { RuntimeContextInvalidError } from "../runtime-errors";

describe("streaming-runtime-context", () => {
  it("creates context with defaults", () => {
    const ctx = createRuntimeContext({ actorId: "a", correlationId: "c" });
    expect(ctx.initiatedAt).toBeTruthy();
  });

  it("asserts correlationId", () => {
    expect(() =>
      assertRuntimeContext(createRuntimeContext({ actorId: "a", correlationId: "" })),
    ).toThrow(RuntimeContextInvalidError);
  });

  it("asserts actorId", () => {
    expect(() =>
      assertRuntimeContext(createRuntimeContext({ actorId: "", correlationId: "c" })),
    ).toThrow(RuntimeContextInvalidError);
  });
});
