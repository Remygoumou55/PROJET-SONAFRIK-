/** Types minimaux Supabase Realtime — découplage du client concret. */
export type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface SupabasePostgresChangePayload {
  schema: string;
  table: string;
  commit_timestamp?: string;
  eventType: PostgresChangeEvent;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  errors?: unknown;
}

export interface SupabaseRealtimeChannelLike {
  on(
    type: "postgres_changes",
    config: {
      event: PostgresChangeEvent;
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: SupabasePostgresChangePayload) => void,
  ): SupabaseRealtimeChannelLike;
  subscribe(callback?: (status: string, err?: Error) => void): SupabaseRealtimeChannelLike;
}

export interface SupabaseRealtimeClientLike {
  channel(name: string): SupabaseRealtimeChannelLike;
  removeChannel(channel: SupabaseRealtimeChannelLike): Promise<unknown>;
}

export interface SupabasePostgresSubscription {
  table: string;
  schema?: string;
  events?: PostgresChangeEvent[];
  filter?: string;
}

export interface SupabaseTransportOptions {
  client: SupabaseRealtimeClientLike;
  channelPrefix?: string;
  subscriptions?: SupabasePostgresSubscription[];
  /** Désactive Realtime (audit local, tests). */
  disabled?: boolean;
}

/** Message normalisé émis par le transport vers le moteur. */
export interface SrtspTransportInboundMessage {
  transport: "supabase";
  table: string;
  eventType: PostgresChangeEvent;
  commitTimestamp?: string;
  record: Record<string, unknown>;
  previousRecord?: Record<string, unknown>;
}
