"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import type { UserPreferences } from "@sonafrik/types";
import { useIdentityService } from "../hooks/useIdentity";
import { ToggleSetting } from "./ToggleSetting";

interface PrivacySectionProps {
  preferences: Pick<UserPreferences, "show_listening_activity" | "profile_visibility">;
}

export function PrivacySection({ preferences }: PrivacySectionProps) {
  const identity = useIdentityService();
  const [activityVisible, setActivityVisible] = useState(preferences.show_listening_activity);
  const [profilePublic, setProfilePublic] = useState(preferences.profile_visibility === "public");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    try {
      await identity.updatePreferences({
        showListeningActivity: activityVisible,
        profileVisibility: profilePublic ? "public" : "private",
      });
      setMessage("Enregistré.");
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidentialité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleSetting
          label="Activité d'écoute visible par mes followers"
          description="Vos followers voient ce que vous écoutez en temps réel."
          checked={activityVisible}
          onChange={setActivityVisible}
        />
        <ToggleSetting
          label="Profil visible publiquement"
          description="Votre profil est accessible par tous les utilisateurs SONAFRIK."
          checked={profilePublic}
          onChange={setProfilePublic}
        />
        {message ? (
          <p className={`text-sm ${message.includes("Erreur") ? "text-rouge-alerte" : "text-vert-energie"}`}>
            {message}
          </p>
        ) : null}
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
}
