import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  const nonce = "test-nonce-base64";

  it("inclut le nonce et strict-dynamic en production", () => {
    const csp = buildContentSecurityPolicy(nonce, true);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("autorise unsafe-eval en développement", () => {
    const csp = buildContentSecurityPolicy(nonce, false);
    expect(csp).toContain("unsafe-eval");
    expect(csp).toContain("unsafe-inline");
  });

  it("autorise Supabase connect et img", () => {
    const csp = buildContentSecurityPolicy(nonce, true);
    expect(csp).toContain("connect-src");
    expect(csp).toContain("supabase.co");
    expect(csp).toContain("img-src");
  });

  it("bloque object-src et frame-ancestors", () => {
    const csp = buildContentSecurityPolicy(nonce, true);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
