/** Isomorphic UUID — safe for Next.js client bundles (no node:crypto). */
export function newRandomId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  throw new Error("crypto.randomUUID indisponible");
}
