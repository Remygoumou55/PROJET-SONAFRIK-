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
import { useCreatorService } from "../../../../features/creator/useCreator";

export default function CreatorIdentityScreen() {
  const router = useRouter();
  const creator = useCreatorService();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stageName, setStageName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    void creator.getCreatorContext().then((ctx) => {
      setStageName(ctx.artistProfile.stage_name);
      setBio(ctx.artistProfile.bio ?? "");
      setLoading(false);
    });
  }, [creator]);

  async function save() {
    setSaving(true);
    try {
      await creator.updateArtistIdentity({ stageName, bio: bio || null, isPublic: true });
      router.back();
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
      <Text style={styles.label}>Nom de scène</Text>
      <TextInput style={styles.input} value={stageName} onChangeText={setStageName} />
      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} multiline />
      <Pressable style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  container: { padding: 16 },
  label: { color: colors.texteSecondaire, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    color: colors.textePrincipal,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  button: { backgroundColor: colors.vertEnergie, padding: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.noirProfond, fontWeight: "700" },
});
