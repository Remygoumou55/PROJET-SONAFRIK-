import { describe, expect, it, vi } from "vitest";
import { StreamingRuntimeFeatureFlagResolver } from "./feature-flags";

describe("StreamingRuntimeFeatureFlagResolver", () => {
  it("resolves flags from admin config", async () => {
    const isFeatureEnabled = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    const client = {} as never;
    const resolver = new StreamingRuntimeFeatureFlagResolver(client);
    (resolver as unknown as { config: { isFeatureEnabled: typeof isFeatureEnabled } }).config = {
      isFeatureEnabled,
    };

    const flags = await resolver.resolve();
    expect(flags.runtimeEnabled).toBe(true);
    expect(flags.applicationLayerEnabled).toBe(false);
    expect(flags.contractsEnabled).toBe(true);
    expect(flags.sessionEngineEnabled).toBe(false);
    expect(isFeatureEnabled).toHaveBeenCalledTimes(15);
  });
});
