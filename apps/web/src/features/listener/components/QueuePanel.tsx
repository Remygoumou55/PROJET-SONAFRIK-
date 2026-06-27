"use client";

import { CoverImage } from "@/components/CoverImage";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerContext } from "../lib/playerContext";

export function QueuePanel() {
  const { currentTrack } = usePlayerContext();
  const { queue, queueIndex, removeFromQueue, clearQueue } = usePlayer();

  const upcomingTracks = queue.filter((_, index) => index > queueIndex);

  return (
    <div className="queue-panel">
      {currentTrack ? (
        <div className="queue-section">
          <p className="queue-section-label">EN COURS</p>
          <div className="queue-current-track">
            <div className="queue-cover">
              <CoverImage
                coverPath={currentTrack.cover_url ?? null}
                alt={currentTrack.title}
                artistName={currentTrack.artist_name ?? currentTrack.title}
                imgSizes="48px"
              />
            </div>
            <div className="queue-info">
              <p className="queue-title">{currentTrack.title}</p>
              <p className="queue-artist">{currentTrack.artist_name ?? "Artiste"}</p>
            </div>
            <span className="queue-playing-indicator">▶ En lecture</span>
          </div>
        </div>
      ) : null}

      <div className="queue-section">
        <div className="queue-section-header">
          <p className="queue-section-label">
            SUIVANT ({upcomingTracks.length} morceau{upcomingTracks.length !== 1 ? "x" : ""})
          </p>
          {upcomingTracks.length > 0 ? (
            <button
              type="button"
              className="queue-clear-btn"
              onClick={() => {
                if (window.confirm("Vider la file d'attente ?")) clearQueue();
              }}
            >
              Tout effacer
            </button>
          ) : null}
        </div>

        {upcomingTracks.length === 0 ? (
          <div className="queue-empty">
            <span className="queue-empty-icon" aria-hidden="true">
              ☰
            </span>
            <p>Votre file d&apos;attente est vide</p>
            <p className="queue-empty-sub">Lancez une playlist ou le mode Découverte pour remplir la file.</p>
          </div>
        ) : (
          <div className="queue-list">
            {upcomingTracks.map((track, index) => (
              <div key={track.id} className="queue-item">
                <span className="queue-item-pos">{index + 1}</span>
                <div className="queue-cover queue-cover--sm">
                  <CoverImage
                    coverPath={track.cover_url ?? null}
                    alt={track.title}
                    artistName={track.artist_name ?? track.title}
                    imgSizes="40px"
                  />
                </div>
                <div className="queue-info">
                  <p className="queue-title">{track.title}</p>
                  <p className="queue-artist">{track.artist_name ?? "Artiste"}</p>
                </div>
                <button
                  type="button"
                  className="queue-remove-btn"
                  onClick={() => removeFromQueue(track.id)}
                  aria-label={`Supprimer ${track.title} de la file`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
