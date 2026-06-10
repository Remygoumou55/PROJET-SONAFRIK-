"use client";

import { useState } from "react";
import { LibraryList } from "./LibraryList";

type Tab = "playlists" | "favoris";

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>("playlists");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#FFFFFF" }}>
        Bibliothèque
      </h1>
      <div className="flex gap-2 mb-6">
        {(["playlists", "favoris"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors"
            style={{
              backgroundColor: tab === t ? "#00D26A" : "#1F1F1F",
              color: tab === t ? "#0D0D0D" : "#A0A0A0",
            }}
          >
            {t === "playlists" ? "Playlists" : "Favoris"}
          </button>
        ))}
      </div>
      {tab === "playlists" && <LibraryList />}
      {tab === "favoris" && (
        <div className="py-8 text-center">
          <p className="text-4xl mb-4">❤️</p>
          <p className="font-semibold mb-1" style={{ color: "#FFFFFF" }}>
            Aucun favori
          </p>
          <p className="text-sm" style={{ color: "#A0A0A0" }}>
            Ajoutez des morceaux et albums en favoris pour les retrouver ici.
          </p>
        </div>
      )}
    </div>
  );
}
