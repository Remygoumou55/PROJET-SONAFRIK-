"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const ROLES = [
  {
    value: "listener" as const,
    accountType: "auditeur" as const,
    emoji: "🎧",
    label: "Auditeur",
    description: "J'écoute de la musique",
    dest: "/onboarding/listener",
  },
  {
    value: "artist" as const,
    accountType: "artiste" as const,
    emoji: "🎤",
    label: "Artiste",
    description: "Je publie ma musique",
    dest: "/onboarding/artist",
  },
] as const;

export default function RolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"listener" | "artist" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(role: (typeof ROLES)[number]) {
    setLoading(role.value);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/connexion");
        return;
      }
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ account_type: role.accountType })
        .eq("id", user.id);
      if (updateErr) throw updateErr;
      router.push(role.dest);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 80px)",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "440px", width: "100%" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Comment voulez-vous utiliser SONAFRIK ?
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Vous pourrez changer de mode plus tard.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ROLES.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => handleSelect(role)}
              disabled={loading !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "18px 20px",
                cursor: loading !== null ? "not-allowed" : "pointer",
                opacity: loading !== null && loading !== role.value ? 0.5 : 1,
                textAlign: "left",
                transition: "border-color 0.2s, background-color 0.2s",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (loading === null) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#00D26A";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(0,210,106,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.04)";
              }}
            >
              <span style={{ fontSize: "28px" }}>{role.emoji}</span>
              <div>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#ffffff",
                    margin: "0 0 4px",
                  }}
                >
                  {role.label}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.45)",
                    margin: 0,
                  }}
                >
                  {role.description}
                </p>
              </div>
              {loading === role.value && (
                <div
                  style={{ marginLeft: "auto" }}
                  className="w-5 h-5 rounded-full border-2 animate-spin"
                  // inline spin styles for reliability
                />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p
            style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "13px",
              color: "#FF4D4F",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
