import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CreatorTeamMember } from "@sonafrik/types";
import { CREATOR_TEAM_ROLE_LABELS } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useCreatorService } from "../../../../features/creator/useCreator";

export default function CreatorTeamScreen() {
  const creator = useCreatorService();
  const [team, setTeam] = useState<CreatorTeamMember[]>([]);
  const [phone, setPhone] = useState("+224");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void creator.getTeam().then((data) => {
      setTeam(data);
      setLoading(false);
    });
  }, [creator]);

  async function invite() {
    try {
      const member = await creator.inviteTeamMember({ memberPhone: phone, role: "editor" });
      setTeam((current) => [...current, member]);
      setPhone("+224");
    } catch {
      alert("Membre introuvable.");
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
    <FlatList
      data={team}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+224XXXXXXXXX"
            placeholderTextColor={colors.texteDesactive}
          />
          <Pressable style={styles.button} onPress={invite}>
            <Text style={styles.buttonText}>Inviter</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.member_id.slice(0, 8)}…</Text>
          <Text style={styles.role}>{CREATOR_TEAM_ROLE_LABELS[item.role]}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  form: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.bordure,
    backgroundColor: colors.surface,
    color: colors.textePrincipal,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  button: { backgroundColor: colors.vertEnergie, padding: 14, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.noirProfond, fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  title: { color: colors.textePrincipal, fontWeight: "600" },
  role: { color: colors.texteSecondaire, marginTop: 4 },
});
