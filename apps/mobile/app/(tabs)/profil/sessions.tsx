import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { UserSession } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useIdentityService } from "../../../features/identity/useIdentity";

export default function SessionsScreen() {
  const identity = useIdentityService();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await identity.getActiveSessions();
    setSessions(data);
    setLoading(false);
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    await identity.revokeSession(id);
    setSessions((current) => current.filter((session) => session.id !== id));
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
      data={sessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>Aucune session active.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.device_name ?? "Appareil inconnu"}</Text>
          <Text style={styles.meta}>{item.platform ?? "—"} · {item.last_active_at.slice(0, 10)}</Text>
          <Pressable style={styles.revoke} onPress={() => revoke(item.id)}>
            <Text style={styles.revokeText}>Révoquer</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  empty: { color: colors.texteSecondaire, textAlign: "center", marginTop: 40 },
  card: {
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  title: { color: colors.textePrincipal, fontWeight: "600" },
  meta: { color: colors.texteDesactive, marginTop: 4, fontSize: 12 },
  revoke: { marginTop: 10, alignSelf: "flex-start" },
  revokeText: { color: colors.vertEnergie, fontWeight: "600" },
});
