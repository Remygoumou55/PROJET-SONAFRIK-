import type { Metadata } from "next";
import { SearchPage } from "@/features/listener/components/SearchPage";

export const metadata: Metadata = {
  title: "Recherche — SONAFRIK",
  description: "Recherchez des morceaux, albums et artistes sur SONAFRIK.",
};

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; q?: string }>;
}) {
  const { genre, q } = await searchParams;
  return <SearchPage initialGenre={genre} initialQuery={q} />;
}
