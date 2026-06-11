export const API_VERSION = "v1" as const;

export const EDGE_FUNCTIONS = {
  auditLog: "audit-log",
  streamStart: "stream-start",
  streamProgress: "stream-progress",
  streamComplete: "stream-complete",
  createLedgerEntry: "create-ledger-entry",
  requestWithdrawal: "request-withdrawal",
  approveWithdrawal: "approve-withdrawal",
  calculateRoyalties: "calculate-royalties",
  distributeRoyalties: "distribute-royalties",
  settlementEngine: "settlement-engine",
  avatarSignedUrl: "avatar-signed-url",
  creatorAssetSignedUrl: "creator-asset-signed-url",
  catalogAssetSignedUrl: "catalog-asset-signed-url",
} as const;

export * from "./auth";
export * from "./identity";
export * from "./creator";
export * from "./catalog";
export * from "./streaming";
export * from "./wallet";
