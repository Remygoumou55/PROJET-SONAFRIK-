import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import { SONAFRIK_BRAND } from "@sonafrik/types";

export default function AccueilTab() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.sona}>SONA</Text>
        <Text style={styles.frik}>FRIK</Text>
      </Text>
      <Text style={styles.slogan}>{SONAFRIK_BRAND.slogan}</Text>
      <Text style={styles.subtitle}>Sprint 3 — Identity OS</Text>
      <Pressable style={styles.button} onPress={() => router.push("/(tabs)/profil")}>
        <Text style={styles.buttonText}>Ouvrir mon profil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.noirProfond,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  sona: { color: colors.textePrincipal },
  frik: { color: colors.vertEnergie },
  slogan: { color: colors.orSolaire, fontSize: 16, fontWeight: "600", marginBottom: 8 },
  subtitle: { color: colors.texteSecondaire, fontSize: 13, marginBottom: 24 },
  button: {
    backgroundColor: colors.vertEnergie,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: colors.noirProfond, fontWeight: "700" },
});
