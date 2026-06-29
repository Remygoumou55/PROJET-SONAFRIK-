import { Suspense } from "react";
import type { Metadata } from "next";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { LibraryLdseProvider } from "@/features/listener/lib/libraryLdseContext";
import { LibraryPage } from "@/features/listener/components/LibraryPage";

export const metadata: Metadata = {
  title: "Bibliothèque — SONAFRIK",
  description: "Vos playlists et favoris sur SONAFRIK.",
};

export default async function Library() {
  const { profile } = await requireIdentityContext();

  return (
    <LibraryLdseProvider userId={profile.id}>
      <Suspense fallback={null}>
        <LibraryPage />
      </Suspense>
    </LibraryLdseProvider>
  );
}
