import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import type { DiscoveryArtist, DiscoveryTrack, TrackWithMeta } from "@sonafrik/types";
import { useDiscovery } from "../../features/streaming/useDiscovery";
import { usePlayerContext } from "../../features/streaming/PlayerContext";

// Convertit DiscoveryTrack → TrackWithMeta pour usePlayer
function toTrackWithMeta(dt: DiscoveryTrack): TrackWithMeta {
  const now = new Date().toISOString();
  return {
    id: dt.track_id,
    creator_id: dt.creator_id,
    album_id: dt.album_id,
    title: dt.title,
    slug: dt.slug,
    track_number: 1,
    isrc: null,
    duration_seconds: dt.duration_seconds,
    explicit: false,
    language: "fr",
    bpm: null,
    musical_key: null,
    publication_status: "published",
    rejection_reason: null,
    submitted_at: null,
    published_at: dt.published_at,
    metadata: {},
    created_at: dt.published_at ?? now,
    updated_at: dt.published_at ?? now,
    deleted_at: null,
    artist_name: dt.artist_name ?? undefined,
    album_title: dt.album_title ?? undefined,
    cover_url: null,
  };
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function formatDuration(secs: number | null): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

// ─── Track card (horizontal scroll) ────────────────────────────────────────
function TrackCard({ track, onPress, isPlaying }: {
  track: DiscoveryTrack;
  onPress: () => void;
  isPlaying: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.trackCard}>
      <View style={[styles.trackCover, isPlaying && styles.trackCoverActive]}>
        {isPlaying ? (
          <Text style={styles.trackCoverIcon}>▶</Text>
        ) : (
          <Text style={styles.trackCoverIcon}>♪</Text>
        )}
      </View>
      <Text style={styles.trackCardTitle} numberOfLines={2}>
        {track.title}
      </Text>
      <Text style={styles.trackCardMeta} numberOfLines={1}>
        {track.artist_name ?? "Artiste"}
      </Text>
      <Text style={styles.trackCardStats}>
        {formatCount(track.stream_count)} écoutes
      </Text>
    </Pressable>
  );
}

// ─── Artist chip (horizontal scroll) ────────────────────────────────────────
function ArtistChip({ artist }: { artist: DiscoveryArtist }) {
  return (
    <View style={styles.artistChip}>
      <View style={styles.artistAvatar}>
        <Text style={styles.artistAvatarText}>
          {artist.stage_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.artistName} numberOfLines={1}>
        {artist.stage_name}
      </Text>
      {artist.verified ? (
        <Text style={styles.artistVerified}>✓</Text>
      ) : null}
    </View>
  );
}

// ─── New release row (vertical list) ────────────────────────────────────────
function NewTrackRow({ track, onPress, isPlaying }: {
  track: DiscoveryTrack;
  onPress: () => void;
  isPlaying: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.newRow}>
      <View style={[styles.newCover, isPlaying && styles.newCoverActive]}>
        <Text style={styles.newCoverIcon}>{isPlaying ? "▶" : "♪"}</Text>
      </View>
      <View style={styles.newInfo}>
        <Text style={styles.newTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.newMeta} numberOfLines={1}>
          {track.artist_name ?? "Artiste"}
          {track.duration_seconds ? `  ·  ${formatDuration(track.duration_seconds)}` : ""}
        </Text>
      </View>
      <Text style={styles.newLikes}>{formatCount(track.like_count)} ♥</Text>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AccueilTab() {
  const { feed, artists, newReleases, isLoading, error } = useDiscovery();
  const { currentTrack, isPlaying, loadAndPlay, pause, resume } = usePlayerContext();

  function handlePlay(track: DiscoveryTrack) {
    const meta = toTrackWithMeta(track);
    if (currentTrack?.id === meta.id) {
      if (isPlaying) { pause(); } else { resume(); }
    } else {
      loadAndPlay(meta);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} size="large" />
      </View>
    );
  }

  const heroTrack = feed[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.brand}>
            <Text style={styles.brandWhite}>SONA</Text>
            <Text style={styles.brandGreen}>FRIK</Text>
          </Text>
        </View>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>NOTRE BIEN COMMUN</Text>
          </View>
        </View>
      </View>

      {/* Hero track ────────────────────────────────────── */}
      {heroTrack ? (
        <Pressable
          style={styles.hero}
          onPress={() => handlePlay(heroTrack)}
        >
          <View style={styles.heroVisual}>
            <Text style={styles.heroIcon}>
              {currentTrack?.id === heroTrack.track_id && isPlaying ? "⏸" : "▶"}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>À la une</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroTrack.title}
            </Text>
            <Text style={styles.heroArtist} numberOfLines={1}>
              {heroTrack.artist_name ?? "Artiste"}
            </Text>
            <Text style={styles.heroStats}>
              {formatCount(heroTrack.stream_count)} écoutes · {formatCount(heroTrack.like_count)} ♥
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* Pour vous ─────────────────────────────────────── */}
      {feed.length > 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pour vous</Text>
          <FlatList
            data={feed.slice(1)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.track_id}
            contentContainerStyle={styles.hScroll}
            renderItem={({ item }) => (
              <TrackCard
                track={item}
                onPress={() => handlePlay(item)}
                isPlaying={currentTrack?.id === item.track_id && isPlaying}
              />
            )}
            removeClippedSubviews
            initialNumToRender={4}
          />
        </View>
      ) : null}

      {/* Top artistes ────────────────────────────────── */}
      {artists.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top artistes</Text>
          <FlatList
            data={artists}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.creator_id}
            contentContainerStyle={styles.hScroll}
            renderItem={({ item }) => <ArtistChip artist={item} />}
            removeClippedSubviews
            initialNumToRender={4}
          />
        </View>
      ) : null}

      {/* Nouveautés ─────────────────────────────────── */}
      {newReleases && newReleases.tracks.length > 0 ? (
        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.sectionTitle}>Nouveautés</Text>
          {newReleases.tracks.map((track) => (
            <NewTrackRow
              key={track.track_id}
              track={track}
              onPress={() => handlePlay(track)}
              isPlaying={currentTrack?.id === track.track_id && isPlaying}
            />
          ))}
        </View>
      ) : null}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noirProfond },
  content: { paddingBottom: 120 },
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: { color: colors.texteSecondaire, fontSize: 13, marginBottom: 2 },
  brand: { fontSize: 28, fontWeight: "800" },
  brandWhite: { color: colors.textePrincipal },
  brandGreen: { color: colors.vertEnergie },
  tagRow: { paddingTop: 8 },
  tag: {
    backgroundColor: "#FFC20E22",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#FFC20E44",
  },
  tagText: { color: colors.orSolaire, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },

  // Hero
  hero: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.vertProfond,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#00D26A33",
  },
  heroVisual: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00000033",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroIcon: { fontSize: 24, color: colors.textePrincipal },
  heroInfo: { flex: 1 },
  heroLabel: { color: "#FFFFFF99", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  heroTitle: { color: colors.textePrincipal, fontSize: 17, fontWeight: "700", marginBottom: 3 },
  heroArtist: { color: "#FFFFFFCC", fontSize: 13, marginBottom: 4 },
  heroStats: { color: "#FFFFFF88", fontSize: 12 },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLast: { marginBottom: 8 },
  sectionTitle: {
    color: colors.textePrincipal,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  hScroll: { gap: 12, paddingRight: 16 },

  // Track card
  trackCard: {
    width: 140,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  trackCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  trackCoverActive: { backgroundColor: "#00D26A22", borderColor: colors.vertEnergie, borderWidth: 1.5 },
  trackCoverIcon: { fontSize: 28, color: colors.texteSecondaire },
  trackCardTitle: { color: colors.textePrincipal, fontSize: 13, fontWeight: "600", marginBottom: 3 },
  trackCardMeta: { color: colors.texteSecondaire, fontSize: 12, marginBottom: 4 },
  trackCardStats: { color: colors.texteDesactive, fontSize: 11 },

  // Artist chip
  artistChip: {
    width: 84,
    alignItems: "center",
    gap: 6,
  },
  artistAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bordure,
  },
  artistAvatarText: { color: colors.vertEnergie, fontSize: 22, fontWeight: "800" },
  artistName: { color: colors.textePrincipal, fontSize: 12, fontWeight: "500", textAlign: "center" },
  artistVerified: { color: colors.vertEnergie, fontSize: 10 },

  // New release row
  newRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.bordure,
    gap: 12,
  },
  newCover: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  newCoverActive: { backgroundColor: "#00D26A22", borderColor: colors.vertEnergie, borderWidth: 1.5 },
  newCoverIcon: { fontSize: 18, color: colors.texteSecondaire },
  newInfo: { flex: 1 },
  newTitle: { color: colors.textePrincipal, fontSize: 14, fontWeight: "600" },
  newMeta: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  newLikes: { color: colors.texteDesactive, fontSize: 12 },

  // Error
  errorText: { color: colors.texteSecondaire, textAlign: "center", marginTop: 20 },
});
