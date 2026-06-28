"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePlayerContext } from "./playerContext";

interface PlayerMuteContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  handleVolumeChange: (nextVolume: number) => void;
}

const PlayerMuteContext = createContext<PlayerMuteContextValue | null>(null);

export function PlayerMuteProvider({ children }: { children: React.ReactNode }) {
  const { volume, setVolume } = usePlayerContext();
  const [isMuted, setIsMuted] = useState(false);
  const volumeBeforeMuteRef = useRef(0.8);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(volumeBeforeMuteRef.current);
      setIsMuted(false);
      return;
    }
    volumeBeforeMuteRef.current = volume > 0 ? volume : 0.8;
    setVolume(0);
    setIsMuted(true);
  }, [isMuted, volume, setVolume]);

  const handleVolumeChange = useCallback(
    (nextVolume: number) => {
      if (isMuted && nextVolume > 0) {
        setIsMuted(false);
      }
      if (nextVolume === 0) {
        volumeBeforeMuteRef.current = volume > 0 ? volume : volumeBeforeMuteRef.current;
        setIsMuted(true);
      }
      setVolume(nextVolume);
    },
    [isMuted, setVolume, volume],
  );

  return (
    <PlayerMuteContext.Provider value={{ isMuted, toggleMute, handleVolumeChange }}>
      {children}
    </PlayerMuteContext.Provider>
  );
}

export function usePlayerMute(): PlayerMuteContextValue {
  const ctx = useContext(PlayerMuteContext);
  if (!ctx) {
    throw new Error("usePlayerMute must be inside PlayerMuteProvider");
  }
  return ctx;
}

export function volumeIcon(isMuted: boolean, volume: number): string {
  if (isMuted || volume === 0) return "🔇";
  if (volume < 0.3) return "🔉";
  return "🔊";
}
