import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { IdentityContext } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useIdentityService } from "../../../features/identity/useIdentity";

export default function AccountScreen() {
  const router = useRouter();
  const identity = useIdentityService();
  const [context, setContext] = useState<IdentityContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void identity.getIdentityContext().then((data) => {
      setContext(data);
      setLoading(false);
    });
  }, [identity]);

  function confirmDelete() {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Vous serez déconnecté.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await identity.requestAccountDeletion();
              router.replace("/auth/connexion");
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer le compte.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (loading || !context) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  const { profile } = context;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Row label="Téléphone" value={profile.phone ?? "—"} />
      <Row label="Email" value={profile.email ?? "—"} />
      <Row label="Type" value={profile.account_type ?? "—"} />
      <Row label="Rôles" value={context.roles.join(", ") || "—"} />

      <View style={styles.danger}>
        <Text style={styles.dangerTitle}>Zone de danger</Text>
        <Text style={styles.dangerText}>
          Suppression soft-delete avec audit INSERT ONLY (CDC V9).
        </Text>
        <Pressable style={styles.deleteButton} onPress={confirmDelete} disabled={deleting}>
          <Text style={styles.deleteText}>
            {deleting ? "Suppression…" : "Supprimer mon compte"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  container: { padding: 16 },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.bordure,
    paddingVertical: 12,
  },
  rowLabel: { color: colors.texteSecondaire, fontSize: 13 },
  rowValue: { color: colors.textePrincipal, marginTop: 4, fontWeight: "500" },
  danger: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  dangerTitle: { color: colors.error, fontWeight: "700", marginBottom: 8 },
  dangerText: { color: colors.texteSecondaire, fontSize: 13, lineHeight: 20 },
  deleteButton: {
    marginTop: 12,
    backgroundColor: colors.error,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: { color: colors.textePrincipal, fontWeight: "700" },
});
