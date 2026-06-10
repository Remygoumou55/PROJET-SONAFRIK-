import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CatalogContext } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useCatalogService } from "../../../../../features/catalog/useCatalog";

export default function CatalogDashboardScreen() {
  const router = useRouter();
  const catalog = useCatalogService();
  const [context, setContext] = useState<CatalogContext | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContext(await catalog.getCatalogContext());
    } finally {
      setLoading(false);
    }
  }, [catalog]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !context) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Catalog OS</Text>
      <View style={styles.stats}>
        <Stat label="Albums" value={String(context.albumsCount)} />
        <Stat label="Singles" value={String(context.singlesCount)} />
        <Stat label="Tracks" value={String(context.tracksCount)} />
      </View>
      <MenuItem label="Albums & Singles" onPress={() => router.push("/(tabs)/profil/creator/catalog/releases")} />
      <MenuItem label="Morceaux" onPress={() => router.push("/(tabs)/profil/creator/catalog/tracks")} />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  container: { padding: 16 },
  title: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700", marginBottom: 16 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  stat: { alignItems: "center" },
  statLabel: { color: colors.texteDesactive, fontSize: 11 },
  statValue: { color: colors.textePrincipal, fontWeight: "700", marginTop: 4 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  menuText: { color: colors.textePrincipal },
  menuChevron: { color: colors.texteDesactive },
});
