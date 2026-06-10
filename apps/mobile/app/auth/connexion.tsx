import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createAuthService, AuthError } from "@sonafrik/api/auth";
import { colors } from "@sonafrik/ui/tokens";
import { getSupabaseMobileClient } from "../../lib/supabase";

export default function ConnexionScreen() {
  const router = useRouter();
  const auth = useMemo(() => createAuthService(getSupabaseMobileClient()), []);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+224");
  const [otp, setOtp] = useState("");
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
      if (!profile?.onboarding_completed) {
        router.replace("/auth/inscription");
        return;
      }
      await auth.registerCurrentSession({ platform: "android" });
      router.replace("/(tabs)/profil");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Code incorrect.");
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
          <Pressable style={styles.button} onPress={sendOtp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.noirProfond} />
            ) : (
              <Text style={styles.buttonText}>Envoyer le code</Text>
            )}
          </Pressable>
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
          <Pressable style={styles.button} onPress={verifyOtp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.noirProfond} />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </Pressable>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={() => router.push("/auth")} style={{ marginTop: 24 }}>
        <Text style={styles.link}>Créer un compte</Text>
      </Pressable>
    </View>
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
  link: { color: colors.vertEnergie, textAlign: "center" },
});
