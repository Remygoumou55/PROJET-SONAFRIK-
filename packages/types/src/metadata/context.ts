/** Execution context passed through all metadata operations */
export interface MetadataContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly initiatedAt: string;
  readonly locale: string;
  readonly attributes: Readonly<Record<string, string>>;
}
