import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type { UserPreferences } from "@sonafrik/types";
import { colors } from "@sonafrik/ui/tokens";
import { useIdentityService } from "../../../features/identity/useIdentity";

export default function PreferencesScreen() {
  const identity = useIdentityService();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void identity.getPreferences().then((data) => {
      setPrefs(data);
      setLoading(false);
    });
  }, [identity]);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    try {
      await identity.updatePreferences({
        language: prefs.language,
        audioQuality: prefs.audio_quality,
        dataSaver: prefs.data_saver,
        autoplayOnWifi: prefs.autoplay_on_wifi,
        autoplayOnCellular: prefs.autoplay_on_cellular,
        explicitContentAllowed: prefs.explicit_content_allowed,
        profileVisibility: prefs.profile_visibility,
        showListeningActivity: prefs.show_listening_activity,
        pushNotifications: prefs.push_notifications,
        emailNotifications: prefs.email_notifications,
        smsNotifications: prefs.sms_notifications,
        marketingNotifications: prefs.marketing_notifications,
        awardsReminders: prefs.awards_reminders,
        newReleasesAlerts: prefs.new_releases_alerts,
        artistCommentReplies: prefs.artist_comment_replies,
        timezone: prefs.timezone,
      });
    } finally {
      setSaving(false);
    }
  }

  function toggle<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setPrefs((current) => (current ? { ...current, [key]: value } : current));
  }

  if (loading || !prefs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ToggleRow
        label="Mode économie de données"
        value={prefs.data_saver}
        onValueChange={(value) => toggle("data_saver", value)}
      />
      <ToggleRow
        label="Lecture auto (Wi-Fi)"
        value={prefs.autoplay_on_wifi}
        onValueChange={(value) => toggle("autoplay_on_wifi", value)}
      />
      <ToggleRow
        label="Lecture auto (mobile)"
        value={prefs.autoplay_on_cellular}
        onValueChange={(value) => toggle("autoplay_on_cellular", value)}
      />
      <ToggleRow
        label="Contenu explicite"
        value={prefs.explicit_content_allowed}
        onValueChange={(value) => toggle("explicit_content_allowed", value)}
      />
      <ToggleRow
        label="Activité d'écoute visible"
        value={prefs.show_listening_activity}
        onValueChange={(value) => toggle("show_listening_activity", value)}
      />
      <ToggleRow
        label="Notifications push"
        value={prefs.push_notifications}
        onValueChange={(value) => toggle("push_notifications", value)}
      />
      <ToggleRow
        label="Notifications email"
        value={prefs.email_notifications}
        onValueChange={(value) => toggle("email_notifications", value)}
      />
      <ToggleRow
        label="Rappels Awards"
        value={prefs.awards_reminders}
        onValueChange={(value) => toggle("awards_reminders", value)}
      />
      <Pressable style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.bordure, true: colors.vertEnergie }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.noirProfond, alignItems: "center", justifyContent: "center" },
  container: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.bordure,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  rowLabel: { color: colors.textePrincipal, flex: 1, paddingRight: 12 },
  button: {
    backgroundColor: colors.vertEnergie,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.noirProfond, fontWeight: "700" },
});
