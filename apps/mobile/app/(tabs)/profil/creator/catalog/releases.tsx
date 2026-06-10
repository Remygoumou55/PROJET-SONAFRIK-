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
import type { Album } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS, RELEASE_TYPE_LABELS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useCatalogService } from "../../../../../features/catalog/useCatalog";

export default function CatalogReleasesScreen() {
  const catalog = useCatalogService();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void catalog.listAlbums().then((data) => {
      setAlbums(data);
      setLoading(false);
    });
  }, [catalog]);

  async function createSingle() {
    if (title.length < 2) return;
    const album = await catalog.createAlbum({ title, releaseType: "single" });
    setAlbums((current) => [album, ...current]);
    setTitle("");
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
      data={albums}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre du single"
            placeholderTextColor={colors.texteDesactive}
          />
          <Pressable style={styles.button} onPress={createSingle}>
            <Text style={styles.buttonText}>Créer</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.meta}>
            {RELEASE_TYPE_LABELS[item.release_type]} · {PUBLICATION_STATUS_LABELS[item.publication_status]}
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
