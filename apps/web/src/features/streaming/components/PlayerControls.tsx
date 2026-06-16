"use client";

import { usePlayer } from "../hooks/usePlayer";

function ShuffleIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1 5h2.5a4 4 0 0 1 3.2 1.6L8 8M15 5l-3.5 3.5M15 11l-3.5-3.5"
        stroke={active ? "#00D26A" : "#555555"}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 11h2.5a4 4 0 0 0 3.2-1.6l1.8-2.4A4 4 0 0 1 11.5 5H15"
        stroke={active ? "#00D26A" : "#555555"}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M11.5 11H15"
        stroke={active ? "#00D26A" : "#555555"}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RepeatIcon({ mode }: { mode: "off" | "one" | "all" }) {
  const color = mode !== "off" ? "#00D26A" : "#555555";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4h10a2 2 0 0 1 2 2v2M14 12H4a2 2 0 0 1-2-2V8"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M11 1.5L14 4l-3 2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14.5L2 12l3-2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {mode === "one" && (
        <text x="7" y="9.5" fontSize="5" fontWeight="700" fill={color} textAnchor="middle">1</text>
      )}
    </svg>
  );
}

export function PlayerControls() {
  const {
    isPlaying,
    isLoading,
    pauseAndSave,
    resume,
    stop,
    playNext,
    playPrev,
    toggleShuffle,
    cycleRepeat,
    shuffle,
    repeatMode,
    queue,
  } = usePlayer();

  const hasQueue = queue.length > 1;

  return (
    <div className="flex items-center gap-1">
      {/* Shuffle */}
      {hasQueue && (
        <button
          onClick={toggleShuffle}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: shuffle ? "#00D26A22" : "transparent" }}
          aria-label={shuffle ? "Désactiver le mode aléatoire" : "Mode aléatoire"}
          title={shuffle ? "Aléatoire activé" : "Aléatoire"}
        >
          <ShuffleIcon active={shuffle} />
        </button>
      )}

      {/* Précédent */}
      {hasQueue && (
        <button
          onClick={playPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: "transparent" }}
          aria-label="Morceau précédent"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#A0A0A0" aria-hidden>
            <rect x="2" y="2" width="2" height="12" rx="1" />
            <path d="M14 2L5 8l9 6V2z" />
          </svg>
        </button>
      )}

      {/* Play / Pause */}
      {isLoading ? (
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      ) : isPlaying ? (
        <button
          onClick={pauseAndSave}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#00D26A" }}
          aria-label="Pause"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#0D0D0D">
            <rect x="3" y="2" width="3.5" height="12" rx="1" />
            <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          onClick={resume}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#00D26A" }}
          aria-label="Lecture"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#0D0D0D">
            <path d="M4 2L14 8L4 14V2Z" />
          </svg>
        </button>
      )}

      {/* Suivant */}
      {hasQueue && (
        <button
          onClick={playNext}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: "transparent" }}
          aria-label="Morceau suivant"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#A0A0A0" aria-hidden>
            <rect x="12" y="2" width="2" height="12" rx="1" />
            <path d="M2 2l9 6-9 6V2z" />
          </svg>
        </button>
      )}

      {/* Repeat */}
      <button
        onClick={cycleRepeat}
        className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
        style={{ backgroundColor: repeatMode !== "off" ? "#00D26A22" : "transparent" }}
        aria-label={
          repeatMode === "off" ? "Activer la répétition" :
          repeatMode === "all" ? "Répéter un morceau" :
          "Désactiver la répétition"
        }
        title={
          repeatMode === "off" ? "Répétition désactivée" :
          repeatMode === "all" ? "Répétition : tous" :
          "Répétition : un seul"
        }
      >
        <RepeatIcon mode={repeatMode} />
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-colors"
        style={{ backgroundColor: "#2A2A2A" }}
        aria-label="Arrêter"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="#A0A0A0">
          <rect x="1" y="1" width="10" height="10" rx="1" />
        </svg>
      </button>
    </div>
  );
}
