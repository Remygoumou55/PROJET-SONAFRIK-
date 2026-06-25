import type { ISRCSequenceKey, ISRCSequenceState } from "@sonafrik/types";
import type { ISRCFormattingProvider } from "@sonafrik/types";
import { ConfigSequenceProvider } from "./providers/ConfigSequenceProvider";
import { ConfigFormattingProvider } from "./providers/ConfigFormattingProvider";
import { ISO3901_FORMAT_CONFIG } from "./config/defaultFormatConfig";

export interface ISRCSequenceService {
  getNextDesignation(key: ISRCSequenceKey): Promise<number>;
  peek(key: ISRCSequenceKey): Promise<number>;
  reset(key: ISRCSequenceKey, startAt?: number): Promise<void>;
  getState(key: ISRCSequenceKey): ISRCSequenceState | null;
}

/** @deprecated Use ConfigSequenceProvider via createProviderBundle */
export class ISRCSequenceServiceImpl implements ISRCSequenceService {
  private readonly delegate: ConfigSequenceProvider;

  constructor(formatting?: ISRCFormattingProvider) {
    this.delegate = new ConfigSequenceProvider(
      formatting ?? new ConfigFormattingProvider(ISO3901_FORMAT_CONFIG),
    );
  }

  getState(_key: ISRCSequenceKey): ISRCSequenceState | null {
    return null;
  }

  peek(key: ISRCSequenceKey): Promise<number> {
    return this.delegate.peek(key);
  }

  getNextDesignation(key: ISRCSequenceKey): Promise<number> {
    return this.delegate.getNextDesignation(key);
  }

  reset(key: ISRCSequenceKey, startAt?: number): Promise<void> {
    return this.delegate.reset(key, startAt);
  }
}
