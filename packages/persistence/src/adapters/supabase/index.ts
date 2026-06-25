export { METADATA_TABLES, METADATA_RPC } from "./supabase-client.port";
export type { SupabaseClientPort, SupabaseQueryBuilderPort, SupabaseQueryResult } from "./supabase-client.port";
export {
  SupabaseISRCRepositoryAdapter,
  SupabaseISRCSequenceRepositoryAdapter,
} from "./supabase-isrc.adapter";
export { SupabaseMetadataRepositoryAdapter } from "./supabase-metadata.adapter";
export { SupabaseUPCRepositoryAdapter } from "./supabase-upc.adapter";
export { SupabaseRegistryRepositoryAdapter } from "./supabase-registry.adapter";
export { SupabaseAuditRepositoryAdapter } from "./supabase-audit.adapter";
export { SupabaseVersionRepositoryAdapter } from "./supabase-version.adapter";
export { SupabaseReleaseRepositoryAdapter } from "./supabase-release.adapter";
export { SupabaseFingerprintRepositoryAdapter } from "./supabase-fingerprint.adapter";
export { SupabaseHealthProbe, createSupabaseClientPort } from "./supabase-health";
