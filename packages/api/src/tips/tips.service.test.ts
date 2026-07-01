import { describe, expect, it, vi } from "vitest";
import { TipsService } from "./tips.service";
import { TipsError } from "./errors";

vi.mock("./tips.repository", () => ({
  TipsRepository: vi.fn().mockImplementation(() => ({
    sendTip: vi.fn(),
  })),
}));

describe("TipsService", () => {
  it("refuse un montant invalide", async () => {
    const service = new TipsService({} as never);
    await expect(
      service.sendTip({ receiverCreatorId: "c1", amountGnf: 3000 as never }),
    ).rejects.toBeInstanceOf(TipsError);
  });
});
