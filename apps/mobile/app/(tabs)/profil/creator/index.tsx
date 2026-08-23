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
import { CreatorError } from "@sonafrik/api/creator";
import type { CreatorContext } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { ScreenHeader } from "../../../../features/shared/components/ScreenHeader";
import { useCreatorService } from "../../../../features/creator/useCreator";

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const creator = useCreatorService();
  const [context, setContext] = useState<CreatorContext | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContext(await creator.getCreatorContext());
    } catch (err) {
      if (err instanceof CreatorError && err.code === "not_artist_account") {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  }, [creator, router]);

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

  const { artistProfile, creator: c } = context;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={artistProfile.stage_name} subtitle={`${c.tier} · ${c.status}`} />
      <Text style={styles.subtitle} numberOfLines={1}>
        {artistProfile.verified ? "✓ Vérifié" : "Non vérifié"}
      </Text>

      <View style={styles.stats}>
        <Stat label="Équipe" value={String(context.teamCount)} />
        <Stat label="Labels" value={String(context.labelCount)} />
        <Stat label="Vérif." value={String(context.pendingVerifications)} />
      </View>

      <MenuItem label="Identité artiste" onPress={() => router.push("/(tabs)/profil/creator/identity")} />
      <MenuItem label="Vérification" onPress={() => router.push("/(tabs)/profil/creator/verification")} />
      <MenuItem label="Labels" onPress={() => router.push("/(tabs)/profil/creator/labels")} />
      <MenuItem label="Équipe" onPress={() => router.push("/(tabs)/profil/creator/team")} />
      <MenuItem
        label="Catalogue musical"
        onPress={() => router.push("/(tabs)/profil/creator/catalog")}
      />
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
  title: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: colors.texteSecondaire, marginBottom: 16 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  stat: { alignItems: "center" },
  statLabel: { color: colors.texteDesactive, fontSize: 11 },
  statValue: { color: colors.textePrincipal, fontWeight: "700", marginTop: 4 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  menuText: { color: colors.textePrincipal },
  menuChevron: { color: colors.texteDesactive, fontSize: 18 },
});
