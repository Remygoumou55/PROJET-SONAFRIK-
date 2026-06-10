import type { Metadata } from "next";
import { SearchPage } from "@/features/streaming/components/SearchPage";

export const metadata: Metadata = {
  title: "Recherche — SONAFRIK",
  description: "Recherchez des morceaux, albums et artistes sur SONAFRIK.",
};

export default function Search() {
  return <SearchPage />;
}
