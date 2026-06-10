import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CreatorVerification } from "@sonafrik/types";
import { VERIFICATION_STATUS_LABELS, VERIFICATION_TYPE_LABELS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useCreatorService } from "../../../../features/creator/useCreator";

export default function CreatorVerificationScreen() {
  const creator = useCreatorService();
  const [items, setItems] = useState<CreatorVerification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void creator.getVerifications().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [creator]);

  async function create(type: "identity" | "artist") {
    const v = await creator.createVerification({ verificationType: type, documentType: "national_id" });
    setItems((current) => [v, ...current]);
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
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.actions}>
          <Pressable style={styles.chip} onPress={() => create("identity")}>
            <Text style={styles.chipText}>Identité</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => create("artist")}>
            <Text style={styles.chipText}>Artiste</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Aucune vérification.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{VERIFICATION_TYPE_LABELS[item.verification_type]}</Text>
          <Text style={styles.status}>{VERIFICATION_STATUS_LABELS[item.status]}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.vertEnergie,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: colors.vertEnergie, fontWeight: "600" },
  empty: { color: colors.texteSecondaire, textAlign: "center", marginTop: 24 },
  card: {
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  title: { color: colors.textePrincipal, fontWeight: "600" },
  status: { color: colors.texteSecondaire, marginTop: 4 },
});
