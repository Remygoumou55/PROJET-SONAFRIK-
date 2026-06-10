import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import { useIdentityService } from "../../../features/identity/useIdentity";

export default function ProfilEditScreen() {
  const router = useRouter();
  const identity = useIdentityService();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("Conakry");
  const [countryCode, setCountryCode] = useState("GN");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void identity.getProfile().then((profile) => {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "Conakry");
      setCountryCode(profile.country_code ?? "GN");
      setEmail(profile.email ?? "");
      setLoading(false);
    });
  }, [identity]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      await identity.updateProfile({
        fullName,
        bio: bio || null,
        city,
        countryCode: countryCode.toUpperCase(),
        email: email || null,
      });
      setMessage("Profil enregistré.");
      router.back();
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label="Nom complet" value={fullName} onChangeText={setFullName} />
      <Field label="Bio" value={bio} onChangeText={setBio} multiline />
      <Field label="Ville" value={city} onChangeText={setCity} />
      <Field label="Pays (ISO)" value={countryCode} onChangeText={setCountryCode} maxLength={2} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "email-address";
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholderTextColor={colors.texteDesactive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  container: { padding: 16 },
  field: { marginBottom: 14 },
  label: { color: colors.texteSecondaire, marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    color: colors.textePrincipal,
    borderRadius: 12,
    padding: 12,
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  button: {
    backgroundColor: colors.vertEnergie,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.noirProfond, fontWeight: "700" },
  message: { color: colors.vertEnergie, marginBottom: 8, textAlign: "center" },
});
