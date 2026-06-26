import { describe, expect, it } from "vitest";
import {
  buildCorsHeaderRecord,
  buildOriginWhitelist,
  isVercelPreviewOrigin,
  resolveAllowedOrigin,
} from "./cors-policy.ts";

describe("cors-policy", () => {
  it("autorise localhost:3000", () => {
    expect(resolveAllowedOrigin("http://localhost:3000", {})).toBe("http://localhost:3000");
  });

  it("autorise production officielle", () => {
    expect(resolveAllowedOrigin("https://sonafrik.vercel.app", {})).toBe(
      "https://sonafrik.vercel.app",
    );
  });

  it("autorise preview Vercel", () => {
    const preview = "https://sonafrik-git-main-remy.vercel.app";
    expect(isVercelPreviewOrigin(preview)).toBe(true);
    expect(resolveAllowedOrigin(preview, {})).toBe(preview);
  });

  it("refuse origine non whitelistée", () => {
    expect(resolveAllowedOrigin("https://evil.example.com", {})).toBeNull();
  });

  it("refuse wildcard jamais", () => {
    const headers = buildCorsHeaderRecord("https://evil.example.com", {});
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("inclut credentials pour origine valide", () => {
    const headers = buildCorsHeaderRecord("http://localhost:3000", {});
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    expect(headers["Vary"]).toBe("Origin");
  });

  it("fusionne ALLOWED_ORIGINS env", () => {
    const list = buildOriginWhitelist({ allowedOrigins: "https://custom.test" });
    expect(list).toContain("https://custom.test");
    expect(list).toContain("http://localhost:3000");
  });

  it("désactive preview si ALLOW_VERCEL_PREVIEW=false", () => {
    const preview = "https://branch-preview.vercel.app";
    expect(resolveAllowedOrigin(preview, { allowVercelPreview: false })).toBeNull();
  });
});
