import type { CountryCode, ISRCValue } from "@sonafrik/types";

export function brandISRC(value: string): ISRCValue {
  return value as ISRCValue;
}

export function brandCountryCode(value: string): CountryCode {
  return value as CountryCode;
}

export function unbrandISRC(value: ISRCValue): string {
  return value;
}
