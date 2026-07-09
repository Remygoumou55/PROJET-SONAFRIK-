/** Production PAGE_SIZE. E2E : `PUBLICATIONS_E2E_PAGE_SIZE` (5–50) pour pagination UI sans seed massif. */
export const PUBLICATIONS_PAGE_SIZE_PRODUCTION = 50;

export function resolvePublicationsPageSize(): number {
  const raw = process.env.PUBLICATIONS_E2E_PAGE_SIZE;
  if (typeof raw === "string" && raw.length > 0) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= PUBLICATIONS_PAGE_SIZE_PRODUCTION) {
      return parsed;
    }
  }
  return PUBLICATIONS_PAGE_SIZE_PRODUCTION;
}
