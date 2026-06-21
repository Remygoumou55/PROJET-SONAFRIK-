"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import {
  AUDIO_QUALITY_OPTIONS,
  LANGUAGE_OPTIONS,
  type UserPreferences,
} from "@sonafrik/types";
import { useIdentityService } from "../hooks/useIdentity";
import { ToggleSetting } from "./ToggleSetting";

interface PreferencesFormProps {
  preferences: UserPreferences;
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const router = useRouter();
  const identity = useIdentityService();
  const [state, setState] = useState(preferences);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    try {
      await identity.updatePreferences({
        language: state.language,
        audioQuality: state.audio_quality,
        dataSaver: state.data_saver,
        autoplayOnWifi: state.autoplay_on_wifi,
        autoplayOnCellular: state.autoplay_on_cellular,
        explicitContentAllowed: state.explicit_content_allowed,
        profileVisibility: state.profile_visibility,
        showListeningActivity: state.show_listening_activity,
        pushNotifications: state.push_notifications,
        emailNotifications: state.email_notifications,
        smsNotifications: state.sms_notifications,
        marketingNotifications: state.marketing_notifications,
        awardsReminders: state.awards_reminders,
        newReleasesAlerts: state.new_releases_alerts,
        artistCommentReplies: state.artist_comment_replies,
        timezone: state.timezone,
      });
      setMessage("Préférences enregistrées.");
      router.refresh();
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Langue & région</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label="Langue de l'application"
            value={state.language}
            options={LANGUAGE_OPTIONS}
            onChange={(value) => update("language", value as UserPreferences["language"])}
          />
          <Field label="Fuseau horaire">
            <input
              value={state.timezone}
              onChange={(event) => update("timezone", event.target.value)}
              className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lecture audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label="Qualité audio"
            value={state.audio_quality}
            options={AUDIO_QUALITY_OPTIONS}
            onChange={(value) =>
              update("audio_quality", value as UserPreferences["audio_quality"])
            }
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-texte-desactive)" }}>
            {AUDIO_QUALITY_OPTIONS.find((o) => o.value === state.audio_quality)?.description ?? ""}
          </p>
          <ToggleSetting
            label="Mode économie de données"
            description="Réduit la qualité sur réseau mobile."
            checked={state.data_saver}
            onChange={(checked) => update("data_saver", checked)}
          />
          <ToggleSetting
            label="Lecture auto (Wi-Fi)"
            checked={state.autoplay_on_wifi}
            onChange={(checked) => update("autoplay_on_wifi", checked)}
          />
          <ToggleSetting
            label="Lecture auto (données mobiles)"
            checked={state.autoplay_on_cellular}
            onChange={(checked) => update("autoplay_on_cellular", checked)}
          />
          <ToggleSetting
            label="Contenu explicite autorisé"
            checked={state.explicit_content_allowed}
            onChange={(checked) => update("explicit_content_allowed", checked)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confidentialité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label="Visibilité du profil"
            value={state.profile_visibility}
            options={[
              { value: "public", label: "Public" },
              { value: "private", label: "Privé" },
            ]}
            onChange={(value) =>
              update("profile_visibility", value as UserPreferences["profile_visibility"])
            }
          />
          <ToggleSetting
            label="Afficher mon activité d'écoute"
            checked={state.show_listening_activity}
            onChange={(checked) => update("show_listening_activity", checked)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications (canaux)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSetting
            label="Notifications push"
            checked={state.push_notifications}
            onChange={(checked) => update("push_notifications", checked)}
          />
          <ToggleSetting
            label="Notifications email"
            checked={state.email_notifications}
            onChange={(checked) => update("email_notifications", checked)}
          />
          <ToggleSetting
            label="Notifications SMS"
            checked={state.sms_notifications}
            onChange={(checked) => update("sms_notifications", checked)}
          />
          <ToggleSetting
            label="Offres & actualités SONAFRIK"
            checked={state.marketing_notifications}
            onChange={(checked) => update("marketing_notifications", checked)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertes contenu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSetting
            label="Rappels Awards"
            checked={state.awards_reminders}
            onChange={(checked) => update("awards_reminders", checked)}
          />
          <ToggleSetting
            label="Nouvelles sorties"
            checked={state.new_releases_alerts}
            onChange={(checked) => update("new_releases_alerts", checked)}
          />
          <ToggleSetting
            label="Réponses aux commentaires (artiste)"
            checked={state.artist_comment_replies}
            onChange={(checked) => update("artist_comment_replies", checked)}
          />
        </CardContent>
      </Card>

      {message ? (
        <p className={`text-sm ${message.includes("Erreur") ? "text-rouge-alerte" : "text-vert-energie"}`}>
          {message}
        </p>
      ) : null}

      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer les préférences"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-texte-secondaire text-sm">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
