"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "ss", label: "Soussou" },
  { value: "ff", label: "Pular" },
  { value: "man", label: "Malinké" },
] as const;

const fieldStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "12px 14px",
  fontSize: "14px",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "rgba(255,255,255,0.5)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export default function ListenerOnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("fr");
  const [backupEmail, setBackupEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      supabase
        .from("profiles")
        .select("full_name, city, preferred_language, email")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) setFullName(data.full_name);
          if (data?.city) setCity(data.city);
          if (data?.preferred_language) setPreferredLanguage(data.preferred_language);
          if (data?.email) setBackupEmail(data.email);
        });
    });
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !city.trim()) {
      setError("Le nom complet et la ville sont obligatoires.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // RPC existante : set account_type + full_name + onboarding_completed
      const { error: rpcErr } = await supabase.rpc("complete_onboarding", {
        p_full_name: fullName.trim(),
        p_account_type: "auditeur",
      });
      if (rpcErr) throw rpcErr;

      // Colonnes supplémentaires (city existe déjà ; preferred_language + backup_email depuis migration)
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          city: city.trim(),
          locale: preferredLanguage,
          preferred_language: preferredLanguage,
          ...(backupEmail.trim() ? { backup_email: backupEmail.trim() } : {}),
        })
        .eq("id", user.id);
      if (updateErr) throw updateErr;

      router.push("/listen");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "480px", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(0,210,106,0.1)",
              border: "0.5px solid rgba(0,210,106,0.3)",
              borderRadius: "8px",
              padding: "4px 10px",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🎧</span>
            <span style={{ fontSize: "11px", color: "#00D26A", fontWeight: 600 }}>
              Compte Auditeur
            </span>
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#ffffff",
              margin: "0 0 6px",
            }}
          >
            Votre profil
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Quelques informations pour personnaliser votre expérience.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Nom complet */}
          <div>
            <label style={labelStyle}>
              Nom complet <span style={{ color: "#00D26A" }}>*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre prénom et nom"
              required
              style={fieldStyle}
            />
          </div>

          {/* Ville */}
          <div>
            <label style={labelStyle}>
              Ville <span style={{ color: "#00D26A" }}>*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex : Conakry, Kindia, Labé…"
              required
              style={fieldStyle}
            />
          </div>

          {/* Langue préférée */}
          <div>
            <label style={labelStyle}>Langue préférée</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              style={{ ...fieldStyle, appearance: "none" }}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}
                  style={{ backgroundColor: "#1A1A1A" }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Email de secours (optionnel) */}
          <div>
            <label style={labelStyle}>Email de secours</label>
            <input
              type="email"
              value={backupEmail}
              onChange={(e) => setBackupEmail(e.target.value)}
              placeholder="optionnel@exemple.com"
              style={{
                ...fieldStyle,
                borderColor: "rgba(255,194,14,0.25)",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,194,14,0.6)",
                marginTop: "5px",
              }}
            >
              Optionnel — pour récupérer votre compte en cas de perte de numéro.
            </p>
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#FF4D4F", margin: 0 }} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#00D26A",
              color: "#0D0D0D",
              fontWeight: 700,
              fontSize: "15px",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Enregistrement…" : "Commencer l'écoute →"}
          </button>
        </form>
      </div>
    </div>
  );
}
