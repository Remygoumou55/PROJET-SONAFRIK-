import { useState } from "react";
import type { GestureResponderEvent } from "react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import { CoverImage } from "./CoverImage";
import { usePlayerContext } from "../../streaming/PlayerContext";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type FullPlayerProps = {
  visible: boolean;
  onClose: () => void;
};

export function FullPlayer({ visible, onClose }: FullPlayerProps) {
  const { currentTrack, isPlaying, currentPosition, duration, pause, resume, seek } = usePlayerContext();
  const progress = duration > 0 ? currentPosition / duration : 0;

  if (!currentTrack) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>En lecture</Text>
          <View style={styles.closeBtn} />
        </View>

        <View style={styles.content}>
          <View style={styles.coverWrap}>
            <CoverImage
              coverPath={currentTrack.cover_url ?? null}
              label={currentTrack.artist_name ?? currentTrack.title}
              size={280}
              borderRadius={24}
            />
          </View>

          <Text style={styles.title} numberOfLines={2}>{currentTrack.title}</Text>
          {currentTrack.artist_name && (
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist_name}</Text>
          )}

          <ProgressBar duration={duration} position={currentPosition} progress={progress} onSeek={seek} />

          <View style={styles.controls}>
            <Pressable style={styles.controlBtn} onPress={isPlaying ? pause : resume}>
              <Text style={styles.controlText}>{isPlaying ? "⏸" : "▶"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProgressBar({
  duration,
  position,
  progress,
  onSeek,
}: {
  duration: number;
  position: number;
  progress: number;
  onSeek: (seconds: number) => void;
}) {
  const [barWidth, setBarWidth] = useState(0);

  function handlePress(e: GestureResponderEvent) {
    if (duration <= 0 || barWidth <= 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / barWidth));
    onSeek(Math.floor(ratio * duration));
  }

  return (
    <View style={styles.progress} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
      <Pressable onPressIn={handlePress} style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </Pressable>
      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.noirProfond,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    marginBottom: 24,
  },
  headerTitle: {
    color: colors.textePrincipal,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.textePrincipal, fontSize: 22 },
  content: { flex: 1, alignItems: "center", paddingTop: 24 },
  coverWrap: { marginBottom: 36 },
  title: {
    color: colors.textePrincipal,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    maxWidth: "90%",
  },
  artist: {
    color: colors.texteSecondaire,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  progress: { width: "100%", marginBottom: 32 },
  barBackground: {
    width: "100%",
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
    justifyContent: "center",
  },
  barFill: { height: "100%", backgroundColor: colors.vertEnergie, borderRadius: 4 },
  times: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: colors.texteSecondaire, fontSize: 12 },
  controls: { flexDirection: "row", alignItems: "center", gap: 32 },
  controlBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.vertEnergie,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: { color: colors.noirProfond, fontSize: 28 },
});
