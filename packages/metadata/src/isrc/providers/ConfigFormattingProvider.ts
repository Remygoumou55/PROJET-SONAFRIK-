import type { ISRCFormatConfig, ISRCFormattingProvider } from "@sonafrik/types";
import {
  buildCanonical,
  formatDisplay,
  segmentOffsets,
} from "../utils/formatHelpers";

const DEFAULT_INPUT_PATTERN = "^[A-Za-z0-9\\s-]+$";
const DEFAULT_MIN_DESIGNATION = 1;
const DEFAULT_MAX_DESIGNATION = 99999;

export class ConfigFormattingProvider implements ISRCFormattingProvider {
  readonly config: ISRCFormatConfig;

  constructor(config: ISRCFormatConfig) {
    this.config = Object.freeze({ ...config });
  }

  stripInput(raw: string): string {
    let value = raw.trim().toUpperCase();
    if (this.config.separator) {
      value = value.split(this.config.separator).join("");
    }
    return value.replace(/\s+/g, "");
  }

  buildCanonical(parts: Record<string, string>): string {
    return buildCanonical(this.config, parts);
  }

  formatDisplay(parts: Record<string, string>): string {
    return formatDisplay(this.config, parts);
  }

  getSegmentOffsets(): Readonly<Record<string, { start: number; end: number }>> {
    return segmentOffsets(this.config);
  }

  validateSegment(name: string, value: string): boolean {
    const segment = this.config.segments.find((s) => s.name === name);
    if (!segment) return false;
    return new RegExp(segment.pattern).test(value);
  }

  getAllowedInputPattern(): RegExp {
    return new RegExp(this.config.allowedInputPattern ?? DEFAULT_INPUT_PATTERN);
  }

  getMinDesignation(): number {
    return this.config.minDesignation ?? DEFAULT_MIN_DESIGNATION;
  }

  getMaxDesignation(): number {
    return this.config.maxDesignation ?? DEFAULT_MAX_DESIGNATION;
  }
}
