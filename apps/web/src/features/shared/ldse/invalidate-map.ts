/** Mappe un événement LDSE vers les clés de cache à invalider. */
export type LdseInvalidationRule = {
  event: string;
  keys: string[];
};

const rules: LdseInvalidationRule[] = [];

export function registerLdseInvalidationRule(rule: LdseInvalidationRule): void {
  rules.push(rule);
}

export function resolveInvalidationKeys(eventType: string): string[] {
  const keys: string[] = [];
  for (const rule of rules) {
    if (rule.event === eventType || eventType.startsWith(`${rule.event}.`)) {
      keys.push(...rule.keys);
    }
  }
  return keys;
}

/** Tests uniquement */
export function _resetInvalidationRulesForTests(): void {
  rules.length = 0;
}
