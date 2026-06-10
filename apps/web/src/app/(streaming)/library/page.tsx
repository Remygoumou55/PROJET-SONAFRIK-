import type { Metadata } from "next";
import { LibraryPage } from "@/features/streaming/components/LibraryPage";

export const metadata: Metadata = {
  title: "Bibliothèque — SONAFRIK",
  description: "Vos playlists et favoris sur SONAFRIK.",
};

export default function Library() {
  return <LibraryPage />;
}
