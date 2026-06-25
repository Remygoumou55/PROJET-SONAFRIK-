import type { PersistenceProviderKind } from "@sonafrik/types";
import type { MetadataRepositoryBundle } from "../contracts";
import {
  InMemoryISRCRepository,
  InMemoryISRCSequenceRepository,
  InMemoryMetadataRepository,
  InMemoryRegistryRepository,
  InMemoryStubAuditRepository,
  InMemoryStubFingerprintRepository,
  InMemoryStubReleaseRepository,
  InMemoryStubVersionRepository,
  InMemoryUPCRepository,
} from "../adapters/memory";
import type { SupabaseClientPort } from "../adapters/supabase/supabase-client.port";
import {
  SupabaseISRCRepositoryAdapter,
  SupabaseISRCSequenceRepositoryAdapter,
} from "../adapters/supabase/supabase-isrc.adapter";
import { SupabaseMetadataRepositoryAdapter } from "../adapters/supabase/supabase-metadata.adapter";
import { SupabaseUPCRepositoryAdapter } from "../adapters/supabase/supabase-upc.adapter";
import { SupabaseRegistryRepositoryAdapter } from "../adapters/supabase/supabase-registry.adapter";
import { SupabaseAuditRepositoryAdapter } from "../adapters/supabase/supabase-audit.adapter";
import { SupabaseVersionRepositoryAdapter } from "../adapters/supabase/supabase-version.adapter";
import { SupabaseReleaseRepositoryAdapter } from "../adapters/supabase/supabase-release.adapter";
import { SupabaseFingerprintRepositoryAdapter } from "../adapters/supabase/supabase-fingerprint.adapter";

export interface MetadataRepositoryFactoryOptions {
  readonly provider: PersistenceProviderKind;
  readonly supabaseClient?: SupabaseClientPort;
  readonly overrides?: Partial<MetadataRepositoryBundle>;
}

function createSupabaseBundle(client: SupabaseClientPort): MetadataRepositoryBundle {
  return {
    metadata: new SupabaseMetadataRepositoryAdapter(client),
    isrc: new SupabaseISRCRepositoryAdapter(client),
    isrcSequence: new SupabaseISRCSequenceRepositoryAdapter(client),
    upc: new SupabaseUPCRepositoryAdapter(client),
    fingerprint: new SupabaseFingerprintRepositoryAdapter(client),
    audit: new SupabaseAuditRepositoryAdapter(client),
    version: new SupabaseVersionRepositoryAdapter(client),
    registry: new SupabaseRegistryRepositoryAdapter(client),
    release: new SupabaseReleaseRepositoryAdapter(client),
  };
}

/** Factory — engine never knows which DB is used */
export class MetadataRepositoryFactory {
  static create(options: MetadataRepositoryFactoryOptions): MetadataRepositoryBundle {
    if (options.provider === "memory") {
      return { ...MetadataRepositoryFactory.createInMemory(), ...options.overrides };
    }

    if (options.provider === "supabase") {
      if (!options.supabaseClient) {
        throw new Error("SupabaseClientPort requis pour provider supabase");
      }
      return { ...createSupabaseBundle(options.supabaseClient), ...options.overrides };
    }

    throw new Error(`Provider non supporté: ${options.provider as string}`);
  }

  static createInMemory(): MetadataRepositoryBundle {
    return {
      metadata: new InMemoryMetadataRepository(),
      isrc: new InMemoryISRCRepository(),
      isrcSequence: new InMemoryISRCSequenceRepository(),
      upc: new InMemoryUPCRepository(),
      fingerprint: new InMemoryStubFingerprintRepository(),
      audit: new InMemoryStubAuditRepository(),
      version: new InMemoryStubVersionRepository(),
      registry: new InMemoryRegistryRepository(),
      release: new InMemoryStubReleaseRepository(),
    };
  }
}

export function createMetadataRepositories(
  options: MetadataRepositoryFactoryOptions,
): MetadataRepositoryBundle {
  return MetadataRepositoryFactory.create(options);
}
