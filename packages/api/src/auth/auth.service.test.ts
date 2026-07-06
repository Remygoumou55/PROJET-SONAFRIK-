import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import { AuthService } from "./auth.service";
import { AuthError } from "./errors";

function createAuthMockClient(rpcImpl?: ReturnType<typeof vi.fn>): SupabaseClient<Database> {
  const rpc =
    rpcImpl ??
    vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        full_name: "Test User",
        account_type: "auditeur",
        onboarding_completed: true,
      },
      error: null,
    });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc,
    from: vi.fn(),
  } as unknown as SupabaseClient<Database>;
}

describe("AuthService.completeOnboarding", () => {
  it("appelle la RPC complete_onboarding (atomique rôle + creator)", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        full_name: "Fatou Camara",
        account_type: "artiste",
        onboarding_completed: true,
      },
      error: null,
    });
    const client = createAuthMockClient(rpc);
    const service = new AuthService(client);

    const profile = await service.completeOnboarding("user-1", {
      accountType: "artiste",
      fullName: "Fatou Camara",
    });

    expect(rpc).toHaveBeenCalledWith("complete_onboarding", {
      p_full_name: "Fatou Camara",
      p_account_type: "artiste",
    });
    expect(profile.account_type).toBe("artiste");
    expect(profile.onboarding_completed).toBe(true);
  });

  it("rejette un accountType invalide", async () => {
    const service = new AuthService(createAuthMockClient());

    await expect(
      service.completeOnboarding("user-1", {
        accountType: "invalid" as "auditeur",
        fullName: "Test",
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("rejette un nom trop court", async () => {
    const service = new AuthService(createAuthMockClient());

    await expect(
      service.completeOnboarding("user-1", {
        accountType: "auditeur",
        fullName: "A",
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});
