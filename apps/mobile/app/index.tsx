import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import { SONAFRIK_BRAND } from "@sonafrik/types";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.sona}>SONA</Text>
        <Text style={styles.frik}>FRIK</Text>
      </Text>
      <Text style={styles.slogan}>{SONAFRIK_BRAND.slogan}</Text>
      <Text style={styles.signature}>{SONAFRIK_BRAND.secondarySignature}</Text>

      <Pressable style={styles.button} onPress={() => router.push("/auth")}>
        <Text style={styles.buttonText}>Commencer</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/auth/connexion")}>
        <Text style={styles.link}>Se connecter</Text>
      </Pressable>

      <Text style={styles.footer}>Sprint 2 — Auth OTP SMS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.noirProfond,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: { fontSize: 36, fontWeight: "800", marginBottom: 8 },
  sona: { color: colors.textePrincipal },
  frik: { color: colors.vertEnergie },
  slogan: { color: colors.orSolaire, fontSize: 18, fontWeight: "600", marginBottom: 4 },
  signature: { color: colors.texteSecondaire, fontSize: 14, marginBottom: 32 },
  button: {
    backgroundColor: colors.vertEnergie,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: { color: colors.noirProfond, fontWeight: "700", fontSize: 16 },
  link: { color: colors.vertEnergie, fontSize: 14 },
  footer: { color: colors.texteDesactive, fontSize: 12, marginTop: 32 },
});
