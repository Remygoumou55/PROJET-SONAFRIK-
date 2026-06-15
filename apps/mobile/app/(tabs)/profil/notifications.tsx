import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Notification } from "@sonafrik/types";
import { NOTIFICATION_TYPE_LABELS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useIdentityService } from "../../../features/identity/useIdentity";

export default function NotificationsScreen() {
  const identity = useIdentityService();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await identity.getNotifications();
    setItems(data);
    setLoading(false);
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    await identity.markNotificationRead(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    );
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
      ListEmptyComponent={<Text style={styles.empty}>Aucune notification.</Text>}
      ListHeaderComponent={
        items.some((item) => !item.read_at) ? (
          <Pressable
            style={styles.markAll}
            onPress={async () => {
              await identity.markAllNotificationsRead();
              void load();
            }}
          >
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </Pressable>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={[styles.card, !item.read_at && styles.unread]}>
          <Text style={styles.category}>{NOTIFICATION_TYPE_LABELS[item.type]}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          {!item.read_at ? (
            <Pressable onPress={() => markRead(item.id)}>
              <Text style={styles.link}>Marquer comme lue</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  empty: { color: colors.texteSecondaire, textAlign: "center", marginTop: 40 },
  markAll: { marginBottom: 12 },
  markAllText: { color: colors.vertEnergie, fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  unread: { borderColor: colors.vertEnergie },
  category: { color: colors.texteDesactive, fontSize: 11, marginBottom: 4 },
  title: { color: colors.textePrincipal, fontWeight: "600", marginBottom: 4 },
  body: { color: colors.texteSecondaire, lineHeight: 20 },
  link: { color: colors.vertEnergie, marginTop: 8, fontSize: 13 },
});
