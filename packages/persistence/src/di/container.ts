import type { MetadataRepositoryBundle } from "../contracts";
import type { PersistenceProviderKind } from "@sonafrik/types";
import type { SupabaseClientPort } from "../adapters/supabase/supabase-client.port";
import { MetadataRepositoryFactory } from "../factory/metadata-repository-factory";
import type { InMemoryTransactionManager } from "../core/transaction-manager";
import { InMemoryTransactionManager as TxManager } from "../core/transaction-manager";

export const PERSISTENCE_TOKENS = {
  REPOSITORIES: "persistence.repositories",
  TRANSACTION_MANAGER: "persistence.transactionManager",
  PROVIDER: "persistence.provider",
} as const;

export interface PersistenceContainerConfig {
  readonly provider: PersistenceProviderKind;
  readonly supabaseClient?: SupabaseClientPort;
  readonly repositoryOverrides?: Partial<MetadataRepositoryBundle>;
}

/** Lightweight DI container — no framework dependency */
export class PersistenceContainer {
  private readonly instances = new Map<string, unknown>();

  constructor(config: PersistenceContainerConfig) {
    const repositories = MetadataRepositoryFactory.create({
      provider: config.provider,
      supabaseClient: config.supabaseClient,
      overrides: config.repositoryOverrides,
    });
    this.instances.set(PERSISTENCE_TOKENS.REPOSITORIES, repositories);
    this.instances.set(PERSISTENCE_TOKENS.TRANSACTION_MANAGER, new TxManager());
    this.instances.set(PERSISTENCE_TOKENS.PROVIDER, config.provider);
  }

  getRepositories(): MetadataRepositoryBundle {
    return this.instances.get(PERSISTENCE_TOKENS.REPOSITORIES) as MetadataRepositoryBundle;
  }

  getTransactionManager(): InMemoryTransactionManager {
    return this.instances.get(PERSISTENCE_TOKENS.TRANSACTION_MANAGER) as InMemoryTransactionManager;
  }

  getProvider(): PersistenceProviderKind {
    return this.instances.get(PERSISTENCE_TOKENS.PROVIDER) as PersistenceProviderKind;
  }
}

export function createPersistenceContainer(
  config: PersistenceContainerConfig,
): PersistenceContainer {
  return new PersistenceContainer(config);
}
