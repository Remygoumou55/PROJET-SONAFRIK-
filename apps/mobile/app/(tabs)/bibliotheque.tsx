import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors } from "@sonafrik/ui/tokens";
import type { LibraryItem, Playlist } from "@sonafrik/types";
import { CoverImage } from "../../features/shared/components/CoverImage";
import { ScreenHeader } from "../../features/shared/components/ScreenHeader";
import { useLibrary } from "../../features/streaming/useLibrary";

type Tab = "playlists" | "favoris";

function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {(["playlists", "favoris"] as const).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, active === tab && styles.tabActive]}
          onPress={() => onChange(tab)}
        >
          <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
            {tab === "playlists" ? "Playlists" : "Favoris"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PlaylistRow({ item }: { item: Playlist }) {
  return (
    <View style={styles.row}>
      <CoverImage coverPath={null} label={item.title} size={48} borderRadius={10} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.track_count} morceau{item.track_count !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

function FavoriteRow({ item }: { item: LibraryItem }) {
  const { entity_type } = item;
  if (entity_type === "track" && item.track) {
    return (
      <View style={styles.row}>
        <CoverImage coverPath={item.track.cover_url ?? null} label={item.track.artist_name ?? item.track.title} size={48} borderRadius={10} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.track.title}</Text>
          <Text style={styles.meta}>{item.track.artist_name ?? "Artiste"}</Text>
        </View>
      </View>
    );
  }
  if (entity_type === "album" && item.album) {
    return (
      <View style={styles.row}>
        <CoverImage coverPath={item.album.cover_url ?? null} label={item.album.artist_name ?? item.album.title} size={48} borderRadius={10} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.album.title}</Text>
          <Text style={styles.meta}>{item.album.artist_name ?? "Album"}</Text>
        </View>
      </View>
    );
  }
  if (entity_type === "playlist" && item.playlist) {
    return <PlaylistRow item={item.playlist} />;
  }
  return (
    <View style={styles.row}>
      <CoverImage coverPath={null} label="Favori" size={48} borderRadius={10} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>Favori</Text>
        <Text style={styles.meta}>{item.entity_type}</Text>
      </View>
    </View>
  );
}

export default function BibliothequeTab() {
  const { playlists, library, isLoading, error, createPlaylist } = useLibrary();
  const [activeTab, setActiveTab] = useState<Tab>("playlists");
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createPlaylist(newTitle.trim());
    setNewTitle("");
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Bibliothèque" />
      <TabBar active={activeTab} onChange={setActiveTab} />

      {error && <Text style={styles.error}>{error}</Text>}

      {activeTab === "playlists" && (
        showForm ? (
          <View style={styles.formRow}>
            <TextInput
              style={styles.formInput}
              placeholder="Nom de la playlist"
              placeholderTextColor={colors.texteDesactive}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              onSubmitEditing={handleCreate}
            />
            <Pressable style={styles.createBtn} onPress={handleCreate}>
              <Text style={styles.createBtnText}>Créer</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => { setShowForm(false); setNewTitle(""); }}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.newPlaylistBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.newPlaylistText}>+ Nouvelle playlist</Text>
          </Pressable>
        )
      )}

      {playlists.length === 0 && activeTab === "playlists" ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyTitle}>Aucune playlist</Text>
          <Text style={styles.emptySubtext}>Créez votre première playlist</Text>
        </View>
      ) : library.length === 0 && activeTab === "favoris" ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptySubtext}>Aimez des morceaux, albums ou artistes</Text>
        </View>
      ) : activeTab === "playlists" ? (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlaylistRow item={item} />}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      ) : (
        <FlatList
          data={library}
          keyExtractor={(item) => `${item.entity_type}-${item.entity_id}`}
          renderItem={({ item }) => <FavoriteRow item={item} />}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noirProfond, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: colors.vertEnergie },
  tabText: { color: colors.texteSecondaire, fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: colors.noirProfond },
  error: { color: colors.texteSecondaire, marginBottom: 8 },
  newPlaylistBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  newPlaylistText: { color: colors.texteSecondaire, fontSize: 14 },
  formRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  formInput: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textePrincipal,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  createBtn: { backgroundColor: colors.vertEnergie, borderRadius: 10, paddingHorizontal: 12, justifyContent: "center" },
  createBtnText: { color: colors.noirProfond, fontWeight: "700", fontSize: 13 },
  cancelBtn: { backgroundColor: colors.elevated, borderRadius: 10, paddingHorizontal: 10, justifyContent: "center" },
  cancelBtnText: { color: colors.texteSecondaire, fontSize: 13 },
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, backgroundColor: colors.card, borderRadius: 12 },
  info: { flex: 1 },
  title: { color: colors.textePrincipal, fontSize: 15, fontWeight: "600" },
  meta: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: colors.textePrincipal, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  emptySubtext: { color: colors.texteSecondaire, fontSize: 13 },
});
