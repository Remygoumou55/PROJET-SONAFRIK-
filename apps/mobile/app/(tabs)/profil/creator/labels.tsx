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
import type { Label } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useCreatorService } from "../../../../features/creator/useCreator";

export default function CreatorLabelsScreen() {
  const creator = useCreatorService();
  const [labels, setLabels] = useState<Label[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void creator.getMyLabels().then((data) => {
      setLabels(data);
      setLoading(false);
    });
  }, [creator]);

  async function create() {
    if (name.length < 2) return;
    const label = await creator.createLabel({ name });
    setLabels((current) => [label, ...current]);
    setName("");
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
      data={labels}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom du label"
            placeholderTextColor={colors.texteDesactive}
          />
          <Pressable style={styles.button} onPress={create}>
            <Text style={styles.buttonText}>Créer</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.slug}>{item.slug}</Text>
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
  title: { color: colors.textePrincipal, fontWeight: "600" },
  slug: { color: colors.texteDesactive, fontSize: 12, marginTop: 4 },
});
