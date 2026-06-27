"use client";

import { useState } from "react";
import { shareTrack } from "@/lib/share";

interface ShareButtonProps {
  trackId: string;
  title: string;
  artistName: string;
  variant?: "icon" | "full";
}

export function ShareButton({
  trackId,
  title,
  artistName,
  variant = "icon",
}: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    await shareTrack({ trackId, title, artistName });
    setShared(true);
    window.setTimeout(() => setShared(false), 2000);
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        className={`share-btn-full${shared ? " shared" : ""}`}
        onClick={() => void handleShare()}
        aria-label={shared ? "Partagé !" : "Partager sur WhatsApp"}
      >
        <span className="share-btn-icon" aria-hidden="true">
          {shared ? "✓" : "↗"}
        </span>
        <span className="share-btn-label">{shared ? "Partagé !" : "Partager"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`share-btn-icon-only${shared ? " shared" : ""}`}
      onClick={() => void handleShare()}
      aria-label={shared ? "Partagé !" : "Partager ce morceau"}
      title="Partager sur WhatsApp"
    >
      {shared ? "✓" : "↗"}
    </button>
  );
}
