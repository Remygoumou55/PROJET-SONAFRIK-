/** URL builder Mes publications — single source (pagination, filtres, tri serveur). */

export type PublicationsSortUi = "updated" | "title";

export interface PublicationsUrlParams {
  page?: number;
  q?: string;
  status?: string;
  sort?: PublicationsSortUi;
}

export function buildPublicationsLibraryUrl({
  page = 1,
  q = "",
  status = "all",
  sort = "updated",
}: PublicationsUrlParams): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q.trim()) params.set("q", q.trim());
  if (status !== "all") params.set("status", status);
  if (sort !== "updated") params.set("sort", sort);
  const query = params.toString();
  return query ? `/creator/catalog/tracks?${query}` : "/creator/catalog/tracks";
}

export function parsePublicationsSortUi(raw?: string | null): PublicationsSortUi {
  return raw === "title" ? "title" : "updated";
}
