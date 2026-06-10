"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@sonafrik/ui";
import type { Profile } from "@sonafrik/types";
import { AvatarUpload } from "./AvatarUpload";
import { useIdentityService } from "../hooks/useIdentity";

interface ProfileEditFormProps {
  profile: Profile;
  avatarUrl?: string | null;
}

export function ProfileEditForm({ profile, avatarUrl }: ProfileEditFormProps) {
  const router = useRouter();
  const identity = useIdentityService();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [city, setCity] = useState(profile.city ?? "Conakry");
  const [countryCode, setCountryCode] = useState(profile.country_code ?? "GN");
  const [email, setEmail] = useState(profile.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await identity.updateProfile({
        fullName,
        bio: bio || null,
        city,
        countryCode: countryCode.toUpperCase(),
        email: email || null,
      });
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Impossible d'enregistrer le profil. Vérifiez les champs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            displayName={fullName || profile.phone || "Utilisateur"}
            initialUrl={avatarUrl}
            onUploaded={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nom complet">
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              maxLength={500}
              rows={4}
              onChange={(event) => setBio(event.target.value)}
              className="border-bordure bg-elevated text-texte-principal focus:border-vert-energie w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ville">
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
            <Field label="Pays (code ISO)">
              <Input
                value={countryCode}
                maxLength={2}
                onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
              />
            </Field>
          </div>
          <Field label="Email (optionnel)">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {error ? <p className="text-rouge-alerte text-sm">{error}</p> : null}
      {success ? (
        <p className="text-vert-energie text-sm">Profil enregistré avec succès.</p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
          Annuler
        </Button>
      </div>
    </form>
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
