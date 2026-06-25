/** Composite key for sequence counters: country + registrant + year */
export interface ISRCSequenceKey {
  readonly countryCode: string;
  readonly registrantCode: string;
  readonly yearOfReference: string;
}

/** Mutable sequence state — persisted via ISRCRepository in Phase 3+ */
export interface ISRCSequenceState {
  readonly key: ISRCSequenceKey;
  readonly lastDesignation: number;
  readonly updatedAt: string;
}
