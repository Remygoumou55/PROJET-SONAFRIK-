import type { SystemSetting } from "@sonafrik/types";

export function formatBusinessRuleValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toLocaleString("fr-FR");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) {
    return value.map((v) => formatBusinessRuleValue(v)).join(", ");
  }
  return JSON.stringify(value);
}

export function parseBusinessRuleDraft(raw: string, current: unknown): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    if (typeof current === "number") {
      const n = Number(trimmed.replace(/\s/g, "").replace(",", "."));
      if (!Number.isNaN(n)) return n;
    }
    return trimmed;
  }
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function countModifiedThisWeek(settings: SystemSetting[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return settings.filter((s) => new Date(s.updated_at).getTime() >= weekAgo).length;
}
