import { Suspense } from "react";
import type { Metadata } from "next";
import { LibraryPage } from "@/features/listener/components/LibraryPage";

export const metadata: Metadata = {
  title: "Bibliothèque — SONAFRIK",
  description: "Vos playlists et favoris sur SONAFRIK.",
};

export default function Library() {
  return (
    <Suspense fallback={null}>
      <LibraryPage />
    </Suspense>
  );
}
