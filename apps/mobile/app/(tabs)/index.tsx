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
import { CoverImage } from "../../features/shared/components/CoverImage";
import { ScreenHeader } from "../../features/shared/components/ScreenHeader";
import { SectionHeader } from "../../features/shared/components/SectionHeader";
import { useDiscovery } from "../../features/streaming/useDiscovery";
import { usePlayerContext } from "../../features/streaming/PlayerContext";

function toTrackWithMeta(dt: DiscoveryTrack): TrackWithMeta {
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
    created_at: dt.published_at ?? new Date().toISOString(),
    updated_at: dt.published_at ?? new Date().toISOString(),
    deleted_at: null,
    artist_name: dt.artist_name ?? undefined,
    album_title: dt.album_title ?? undefined,
    cover_url: dt.cover_path,
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

function TrackCard({ track, onPress, isPlaying }: {
  track: DiscoveryTrack;
  onPress: () => void;
  isPlaying: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.trackCard}>
      <View style={[styles.coverWrap, isPlaying && styles.coverWrapActive]}>
        <CoverImage coverPath={track.cover_path} label={track.artist_name ?? track.title} size={140} borderRadius={10} />
      </View>
      <Text style={styles.trackCardTitle} numberOfLines={2}>{track.title}</Text>
      <Text style={styles.trackCardMeta} numberOfLines={1}>{track.artist_name ?? "Artiste"}</Text>
      <Text style={styles.trackCardStats}>{formatCount(track.stream_count)} écoutes</Text>
    </Pressable>
  );
}

function ArtistChip({ artist }: { artist: DiscoveryArtist }) {
  return (
    <View style={styles.artistChip}>
      <CoverImage coverPath={artist.cover_path} label={artist.stage_name} size={64} round />
      <Text style={styles.artistName} numberOfLines={1}>{artist.stage_name}</Text>
      {artist.verified ? <Text style={styles.artistVerified}>✓</Text> : null}
    </View>
  );
}

function NewTrackRow({ track, onPress, isPlaying }: {
  track: DiscoveryTrack;
  onPress: () => void;
  isPlaying: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.newRow}>
      <View style={[styles.newCover, isPlaying && styles.newCoverActive]}>
        <CoverImage coverPath={track.cover_path} label={track.artist_name ?? track.title} size={46} borderRadius={10} />
      </View>
      <View style={styles.newInfo}>
        <Text style={styles.newTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.newMeta} numberOfLines={1}>
          {track.artist_name ?? "Artiste"}
          {track.duration_seconds ? `  ·  ${formatDuration(track.duration_seconds)}` : ""}
        </Text>
      </View>
      <Text style={styles.newLikes}>{formatCount(track.like_count)} ♥</Text>
    </Pressable>
  );
}

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="SONAFRIK" subtitle={greeting()} rightIcon="⚙" onRightPress={() => {}} />

      {heroTrack ? (
        <Pressable style={styles.hero} onPress={() => handlePlay(heroTrack)}>
          <CoverImage coverPath={heroTrack.cover_path} label={heroTrack.artist_name ?? heroTrack.title} size={80} borderRadius={16} />
          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>À la une</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>{heroTrack.title}</Text>
            <Text style={styles.heroArtist} numberOfLines={1}>{heroTrack.artist_name ?? "Artiste"}</Text>
            <Text style={styles.heroStats}>
              {formatCount(heroTrack.stream_count)} écoutes · {formatCount(heroTrack.like_count)} ♥
            </Text>
          </View>
        </Pressable>
      ) : null}

      {feed.length > 1 ? (
        <View style={styles.section}>
          <SectionHeader title="Pour vous" />
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

      {artists.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Top artistes" />
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

      {newReleases && newReleases.tracks.length > 0 ? (
        <View style={[styles.section, styles.sectionLast]}>
          <SectionHeader title="Nouveautés" />
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noirProfond },
  content: { paddingBottom: 120 },
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },

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
    borderColor: colors.vertEnergie20,
  },
  heroInfo: { flex: 1, marginLeft: 14 },
  heroLabel: { color: colors.blanc60, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  heroTitle: { color: colors.textePrincipal, fontSize: 17, fontWeight: "700", marginBottom: 3 },
  heroArtist: { color: colors.blanc80, fontSize: 13, marginBottom: 4 },
  heroStats: { color: colors.blanc53, fontSize: 12 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLast: { marginBottom: 8 },
  hScroll: { gap: 12, paddingRight: 16 },

  trackCard: { width: 140 },
  coverWrap: { borderRadius: 10, marginBottom: 10 },
  coverWrapActive: { borderWidth: 1.5, borderColor: colors.vertEnergie, borderRadius: 11, padding: 1 },
  trackCardTitle: { color: colors.textePrincipal, fontSize: 13, fontWeight: "600", marginBottom: 3 },
  trackCardMeta: { color: colors.texteSecondaire, fontSize: 12, marginBottom: 4 },
  trackCardStats: { color: colors.texteDesactive, fontSize: 11 },

  artistChip: { width: 84, alignItems: "center", gap: 6 },
  artistName: { color: colors.textePrincipal, fontSize: 12, fontWeight: "500", textAlign: "center" },
  artistVerified: { color: colors.vertEnergie, fontSize: 10 },

  newRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.bordure, gap: 12 },
  newCover: { borderRadius: 10 },
  newCoverActive: { borderWidth: 1.5, borderColor: colors.vertEnergie, borderRadius: 11, padding: 1 },
  newInfo: { flex: 1 },
  newTitle: { color: colors.textePrincipal, fontSize: 14, fontWeight: "600" },
  newMeta: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  newLikes: { color: colors.texteDesactive, fontSize: 12 },

  errorText: { color: colors.texteSecondaire, textAlign: "center", marginTop: 20 },
});
