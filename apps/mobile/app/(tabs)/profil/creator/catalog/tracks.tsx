import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Track } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useCatalogService } from "../../../../../features/catalog/useCatalog";

export default function CatalogTracksScreen() {
  const catalog = useCatalogService();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [isrc, setIsrc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void catalog.listTracks().then((data) => {
      setTracks(data);
      setLoading(false);
    });
  }, [catalog]);

  async function createTrack() {
    if (title.length < 2) return;
    const track = await catalog.createTrack({ title, isrc: isrc || null });
    setTracks((current) => [track, ...current]);
    setTitle("");
    setIsrc("");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  return (
    <FlatList
      data={tracks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre"
            placeholderTextColor={colors.texteDesactive}
          />
          <TextInput
            style={styles.input}
            value={isrc}
            onChangeText={setIsrc}
            placeholder="ISRC"
            placeholderTextColor={colors.texteDesactive}
            autoCapitalize="characters"
          />
          <Pressable style={styles.button} onPress={createTrack}>
            <Text style={styles.buttonText}>Créer</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.meta}>
            {PUBLICATION_STATUS_LABELS[item.publication_status]}
            {item.isrc ? ` · ${item.isrc}` : ""}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  form: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    color: colors.textePrincipal,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  button: { backgroundColor: colors.vertEnergie, padding: 14, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.noirProfond, fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  cardTitle: { color: colors.textePrincipal, fontWeight: "600" },
  meta: { color: colors.texteSecondaire, marginTop: 4, fontSize: 12 },
});
