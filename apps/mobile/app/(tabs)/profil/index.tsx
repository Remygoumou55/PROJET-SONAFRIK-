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
import { IdentityError } from "@sonafrik/api/identity";
import type { IdentityContext } from "@sonafrik/types";
import { ACCOUNT_TYPE_OPTIONS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { CoverImage } from "../../../features/shared/components/CoverImage";
import { ScreenHeader } from "../../../features/shared/components/ScreenHeader";
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
      <ScreenHeader title="Mon profil" />

      <View style={styles.header}>
        <CoverImage coverPath={avatarUrl ?? null} label={displayName} size={96} round />
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {profile.city ?? "Conakry"} · {profile.country_code ?? "GN"}
        </Text>
        {accountLabel ? <Text style={styles.badge} numberOfLines={1}>{accountLabel}</Text> : null}
        <Text style={styles.bio} numberOfLines={3}>{profile.bio ?? "Aucune bio pour le moment."}</Text>
      </View>

      <MenuItem label="Modifier le profil" onPress={() => router.push("/(tabs)/profil/edit")} />
      {profile.account_type === "artiste" || profile.account_type === "auditeur_artiste" ? (
        <MenuItem
          label="Espace créateur"
          onPress={() => router.push("/(tabs)/profil/creator")}
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
  error: { color: colors.error, marginBottom: 12 },
  link: { color: colors.vertEnergie },
});
