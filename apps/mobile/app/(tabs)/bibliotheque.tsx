import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors } from "@sonafrik/ui/tokens";
import { useLibrary } from "../../features/streaming/useLibrary";

export default function BibliothequeTab() {
  const { playlists, isLoading, error, createPlaylist } = useLibrary();
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
      <Text style={styles.title}>Bibliothèque</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {showForm ? (
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
      )}
      {playlists.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyTitle}>Aucune playlist</Text>
          <Text style={styles.emptySubtext}>Créez votre première playlist</Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playlistRow}>
              <View style={styles.playlistIcon} />
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.playlistMeta}>
                  {item.track_count} morceau{item.track_count !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          removeClippedSubviews={true}
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
  center: { alignItems: "center", justifyContent: "center" },
  title: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700", marginBottom: 16 },
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
  playlistRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, backgroundColor: colors.card, borderRadius: 12 },
  playlistIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.elevated },
  playlistInfo: { flex: 1 },
  playlistTitle: { color: colors.textePrincipal, fontSize: 15, fontWeight: "600" },
  playlistMeta: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: colors.textePrincipal, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  emptySubtext: { color: colors.texteSecondaire, fontSize: 13 },
});
