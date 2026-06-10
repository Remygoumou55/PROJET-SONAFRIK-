import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AccountType } from "@sonafrik/types";
import { createAuthService, AuthError } from "@sonafrik/api/auth";
import { colors } from "@sonafrik/ui/tokens";
import { getSupabaseMobileClient } from "../../lib/supabase";

export default function InscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountType?: string }>();
  const auth = useMemo(() => createAuthService(getSupabaseMobileClient()), []);

  const accountType = params.accountType as AccountType | undefined;
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("+224");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    try {
      await auth.requestOtp({ phone });
      setStep("otp");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    setLoading(true);
    try {
      const { profile } = await auth.verifyOtp({ phone, token: otp });
      if (profile?.onboarding_completed) {
        router.replace("/");
        return;
      }
      setStep("profile");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Code incorrect.");
    } finally {
      setLoading(false);
    }
  }

  async function finishProfile() {
    if (!accountType) {
      setError("Type de compte manquant.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await auth.completeOnboardingForCurrentUser({ accountType, fullName });
      await auth.registerCurrentSession({ platform: "android" });
      router.replace("/");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Erreur inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {step === "phone" && (
        <>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+224620000000"
            placeholderTextColor={colors.texteDesactive}
          />
          <PrimaryButton label="Recevoir le code SMS" loading={loading} onPress={sendOtp} />
        </>
      )}

      {step === "otp" && (
        <>
          <Text style={styles.hint}>Code envoyé au {phone}</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.texteDesactive}
          />
          <PrimaryButton label="Vérifier" loading={loading} onPress={verifyOtp} />
        </>
      )}

      {step === "profile" && (
        <>
          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Votre nom"
            placeholderTextColor={colors.texteDesactive}
          />
          <PrimaryButton label="Terminer" loading={loading} onPress={finishProfile} />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function PrimaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress} disabled={loading} accessibilityRole="button">
      {loading ? <ActivityIndicator color={colors.noirProfond} /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.noirProfond },
  label: { color: colors.textePrincipal, marginBottom: 8, fontWeight: "500" },
  hint: { color: colors.texteSecondaire, marginBottom: 12, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    color: colors.textePrincipal,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.vertEnergie,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: colors.noirProfond, fontWeight: "700", fontSize: 16 },
  error: { color: "#FF4444", marginTop: 12, textAlign: "center" },
});
