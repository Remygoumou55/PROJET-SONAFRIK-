import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors } from "@sonafrik/ui/tokens";
import { useSearch } from "../../features/streaming/useSearch";

export default function ExplorerTab() {
  const [query, setQuery] = useState("");
  const { results, isSearching, error, search, clearSearch } = useSearch();

  const handleChange = (text: string) => {
    setQuery(text);
    search(text);
    if (!text) clearSearch();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorer</Text>
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
      {isSearching && (
        <ActivityIndicator color={colors.vertEnergie} style={styles.loader} />
      )}
      {results && !isSearching && (
        <>
          {results.tracks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Morceaux</Text>
              <FlatList
                data={results.tracks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.trackRow}>
                    <View style={styles.trackIcon} />
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                      {item.artist_name && (
                        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist_name}</Text>
                      )}
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={5}
              />
            </>
          )}
          {results.total === 0 && (
            <Text style={styles.emptyText}>Aucun résultat pour « {results.query} »</Text>
          )}
        </>
      )}
      {!query && !isSearching && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🎵</Text>
          <Text style={styles.placeholderText}>Recherchez votre musique</Text>
          <Text style={styles.placeholderSubtext}>Morceaux, albums, artistes africains</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noirProfond, padding: 16 },
  title: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700", marginBottom: 16 },
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
  sectionTitle: { color: colors.texteSecondaire, fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  trackIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.elevated },
  trackInfo: { flex: 1 },
  trackTitle: { color: colors.textePrincipal, fontSize: 14, fontWeight: "500" },
  trackArtist: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  emptyText: { color: colors.texteSecondaire, textAlign: "center", marginTop: 32 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 48 },
  placeholderEmoji: { fontSize: 40, marginBottom: 16 },
  placeholderText: { color: colors.textePrincipal, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  placeholderSubtext: { color: colors.texteSecondaire, fontSize: 13 },
});
