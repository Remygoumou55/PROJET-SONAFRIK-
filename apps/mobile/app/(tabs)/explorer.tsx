import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors } from "@sonafrik/ui/tokens";
import type { AlbumWithMeta, ArtistResult, TrackWithMeta } from "@sonafrik/types";
import { CoverImage } from "../../features/shared/components/CoverImage";
import { ScreenHeader } from "../../features/shared/components/ScreenHeader";
import { useSearch } from "../../features/streaming/useSearch";

function TrackRow({ track }: { track: TrackWithMeta }) {
  return (
    <View style={styles.row}>
      <CoverImage coverPath={track.cover_url ?? null} label={track.artist_name ?? track.title} size={48} borderRadius={8} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        {track.artist_name && <Text style={styles.meta} numberOfLines={1}>{track.artist_name}</Text>}
      </View>
    </View>
  );
}

function AlbumRow({ album }: { album: AlbumWithMeta }) {
  return (
    <View style={styles.row}>
      <CoverImage coverPath={album.cover_url ?? null} label={album.artist_name ?? album.title} size={48} borderRadius={8} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{album.title}</Text>
        {album.artist_name && <Text style={styles.meta} numberOfLines={1}>{album.artist_name}</Text>}
      </View>
    </View>
  );
}

function ArtistRow({ artist }: { artist: ArtistResult }) {
  return (
    <View style={styles.row}>
      <CoverImage coverPath={artist.cover_path} label={artist.stage_name} size={48} round />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{artist.stage_name}</Text>
        {artist.verified && <Text style={styles.meta}>✓ Artiste vérifié</Text>}
      </View>
    </View>
  );
}

function Section<T>({ title, data, renderItem, empty }: { title: string; data: T[]; renderItem: (item: T) => React.ReactElement; empty: boolean }) {
  if (empty) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map((item, index) => (
        <View key={index}>{renderItem(item)}</View>
      ))}
    </View>
  );
}

export default function ExplorerTab() {
  const [query, setQuery] = useState("");
  const { results, isSearching, error, search, clearSearch } = useSearch();

  const handleChange = (text: string) => {
    setQuery(text);
    if (!text) {
      clearSearch();
    } else {
      search(text);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Explorer" />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Artiste, morceau, album…"
          placeholderTextColor={colors.texteDesactive}
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {isSearching && <ActivityIndicator color={colors.vertEnergie} style={styles.loader} />}

      {!query && !isSearching && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🎵</Text>
          <Text style={styles.placeholderText}>Recherchez votre musique</Text>
          <Text style={styles.placeholderSubtext}>Morceaux, albums, artistes et playlists</Text>
        </View>
      )}

      {results && !isSearching && (
        <FlatList
          data={[1]}
          keyExtractor={() => "results"}
          renderItem={() => (
            <View style={styles.results}>
              <Section
                title="Morceaux"
                data={results.tracks}
                empty={results.tracks.length === 0}
                renderItem={(track) => <TrackRow track={track} />}
              />
              <Section
                title="Albums"
                data={results.albums}
                empty={results.albums.length === 0}
                renderItem={(album) => <AlbumRow album={album} />}
              />
              <Section
                title="Artistes"
                data={results.artists}
                empty={results.artists.length === 0}
                renderItem={(artist) => <ArtistRow artist={artist} />}
              />
              {results.total === 0 && (
                <Text style={styles.emptyText}>Aucun résultat pour « {results.query} »</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noirProfond, padding: 16 },
  searchContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  searchInput: { color: colors.textePrincipal, fontSize: 15, paddingVertical: 12 },
  loader: { marginTop: 24 },
  error: { color: colors.texteSecondaire, textAlign: "center", marginTop: 8 },
  results: { paddingBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: colors.texteSecondaire,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  info: { flex: 1 },
  title: { color: colors.textePrincipal, fontSize: 14, fontWeight: "500" },
  meta: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  emptyText: { color: colors.texteSecondaire, textAlign: "center", marginTop: 32 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 48 },
  placeholderEmoji: { fontSize: 40, marginBottom: 16 },
  placeholderText: { color: colors.textePrincipal, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  placeholderSubtext: { color: colors.texteSecondaire, fontSize: 13 },
});
