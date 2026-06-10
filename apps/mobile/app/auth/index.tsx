import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AccountType } from "@sonafrik/types";
import { ACCOUNT_TYPE_OPTIONS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";

export default function AuthIndexScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<AccountType | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Comment voulez-vous utiliser SONAFRIK ?</Text>
      {ACCOUNT_TYPE_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === option.value }}
          onPress={() => setSelected(option.value)}
          style={[styles.option, selected === option.value && styles.optionSelected]}
        >
          <Text style={styles.emoji}>{option.emoji}</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionDesc}>{option.description}</Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        disabled={!selected}
        onPress={() =>
          router.push({
            pathname: "/auth/inscription",
            params: { accountType: selected ?? "" },
          })
        }
        style={[styles.button, !selected && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/auth/connexion")}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { color: colors.textePrincipal, fontSize: 18, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.card,
  },
  optionSelected: { borderColor: colors.vertEnergie, backgroundColor: "rgba(0,210,106,0.1)" },
  emoji: { fontSize: 24 },
  optionText: { flex: 1 },
  optionLabel: { color: colors.textePrincipal, fontWeight: "600" },
  optionDesc: { color: colors.texteSecondaire, fontSize: 13, marginTop: 2 },
  button: {
    marginTop: 12,
    backgroundColor: colors.vertEnergie,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.noirProfond, fontWeight: "700", fontSize: 16 },
  link: { color: colors.vertEnergie, textAlign: "center", marginTop: 16 },
});
