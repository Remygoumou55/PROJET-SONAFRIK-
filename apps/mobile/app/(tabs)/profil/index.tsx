import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { IdentityError } from "@sonafrik/api/identity";
import type { IdentityContext } from "@sonafrik/types";
import { ACCOUNT_TYPE_OPTIONS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useIdentityService } from "../../../features/identity/useIdentity";

export default function ProfilScreen() {
  const router = useRouter();
  const identity = useIdentityService();
  const [context, setContext] = useState<IdentityContext | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ctx, url] = await Promise.all([
        identity.getIdentityContext(),
        identity.getAvatarSignedUrl(),
      ]);
      setContext(ctx);
      setAvatarUrl(url);
    } catch (err) {
      if (err instanceof IdentityError && err.code === "unauthorized") {
        router.replace("/auth/connexion");
        return;
      }
      setError("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }, [identity, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  if (error || !context) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Erreur"}</Text>
        <Pressable onPress={load}>
          <Text style={styles.link}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  const { profile } = context;
  const displayName = profile.full_name ?? profile.phone ?? "Utilisateur";
  const accountLabel =
    ACCOUNT_TYPE_OPTIONS.find((option) => option.value === profile.account_type)?.label ??
    profile.account_type;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.meta}>
          {profile.city ?? "Conakry"} · {profile.country_code ?? "GN"}
        </Text>
        {accountLabel ? <Text style={styles.badge}>{accountLabel}</Text> : null}
        <Text style={styles.bio}>{profile.bio ?? "Aucune bio pour le moment."}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Non lues" value={String(context.unreadNotifications)} />
        <Stat label="Sessions" value={String(context.activeSessions)} />
        <Stat label="Langue" value={context.preferences.language} />
      </View>

      <MenuItem label="Modifier le profil" onPress={() => router.push("/(tabs)/profil/edit")} />
      {profile.account_type === "artiste" || profile.account_type === "auditeur_artiste" ? (
        <MenuItem
          label="Espace créateur (Creator OS)"
          onPress={() => router.push("/(tabs)/profil/creator/index")}
        />
      ) : null}
      <MenuItem label="Préférences" onPress={() => router.push("/(tabs)/profil/preferences")} />
      <MenuItem
        label={`Notifications${context.unreadNotifications ? ` (${context.unreadNotifications})` : ""}`}
        onPress={() => router.push("/(tabs)/profil/notifications")}
      />
      <MenuItem label="Sessions actives" onPress={() => router.push("/(tabs)/profil/sessions")} />
      <MenuItem label="Compte & suppression" onPress={() => router.push("/(tabs)/profil/account")} />
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
  center: {
    flex: 1,
    backgroundColor: colors.noirProfond,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { padding: 16, paddingBottom: 32 },
  header: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  avatarInitial: { color: colors.textePrincipal, fontSize: 32, fontWeight: "700" },
  name: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700" },
  meta: { color: colors.texteSecondaire, marginTop: 4 },
  badge: {
    marginTop: 8,
    color: colors.vertEnergie,
    borderWidth: 1,
    borderColor: colors.vertEnergie,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
  },
  bio: { color: colors.texteSecondaire, textAlign: "center", marginTop: 12, lineHeight: 20 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  stat: { alignItems: "center" },
  statLabel: { color: colors.texteDesactive, fontSize: 11, textTransform: "uppercase" },
  statValue: { color: colors.textePrincipal, fontWeight: "600", marginTop: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  menuText: { color: colors.textePrincipal, fontSize: 15 },
  menuChevron: { color: colors.texteDesactive, fontSize: 20 },
  error: { color: "#FF4444", marginBottom: 12 },
  link: { color: colors.vertEnergie },
});
