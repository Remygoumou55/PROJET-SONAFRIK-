"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const GENRE_OPTIONS = [
  "Afrobeat", "R&B Africain", "Traditionnel", "Rap GN", "Gospel",
  "Mandingue", "Souk Souk", "Funaná", "Jazz", "Reggae", "Coupé-décalé", "Autre",
] as const;

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "ss", label: "Soussou" },
  { value: "ff", label: "Pular" },
  { value: "man", label: "Malinké" },
  { value: "multi", label: "Plusieurs langues" },
] as const;

const REGION_OPTIONS = [
  "Conakry", "Kindia", "Boké", "Faranah", "Kankan",
  "Labé", "Mamou", "N'Zérékoré", "Diaspora / Autre",
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

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [stageName, setStageName] = useState("");
  const [mainGenre, setMainGenre] = useState("");
  const [songLanguage, setSongLanguage] = useState("fr");
  const [originRegion, setOriginRegion] = useState("");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState("+224");
  const [mtnMoneyNumber, setMtnMoneyNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      supabase
        .from("profiles")
        .select("stage_name, main_genre, origin_region, orange_money_number, mtn_money_number")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.stage_name) setStageName(data.stage_name);
          if (data?.main_genre) setMainGenre(data.main_genre);
          if (data?.origin_region) setOriginRegion(data.origin_region);
          if (data?.orange_money_number) setOrangeMoneyNumber(data.orange_money_number);
          if (data?.mtn_money_number) setMtnMoneyNumber(data.mtn_money_number);
        });
    });
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stageName.trim()) {
      setError("Le nom de scène est obligatoire.");
      return;
    }
    if (!orangeMoneyNumber.trim() || orangeMoneyNumber.trim() === "+224") {
      setError("Le numéro Orange Money est obligatoire pour recevoir vos revenus.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // RPC existante : set account_type + onboarding_completed
      const { error: rpcErr } = await supabase.rpc("complete_onboarding", {
        p_full_name: stageName.trim(),
        p_account_type: "artiste",
      });
      if (rpcErr) throw rpcErr;

      // Colonnes artiste spécifiques (depuis migration 20260618)
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          stage_name: stageName.trim(),
          main_genre: mainGenre || null,
          song_language: songLanguage,
          origin_region: originRegion || null,
          orange_money_number: orangeMoneyNumber.trim(),
          ...(mtnMoneyNumber.trim() ? { mtn_money_number: mtnMoneyNumber.trim() } : {}),
        })
        .eq("id", user.id);
      if (updateErr) throw updateErr;

      router.push("/creator");
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
              backgroundColor: "rgba(55,138,221,0.1)",
              border: "0.5px solid rgba(55,138,221,0.3)",
              borderRadius: "8px",
              padding: "4px 10px",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🎤</span>
            <span style={{ fontSize: "11px", color: "#378ADD", fontWeight: 600 }}>
              Compte Artiste
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
            Votre profil artiste
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Ces informations permettent à SONAFRIK de vous payer et de vous référencer.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Nom de scène */}
          <div>
            <label style={labelStyle}>
              Nom de scène <span style={{ color: "#00D26A" }}>*</span>
            </label>
            <input
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="Votre nom d'artiste"
              required
              style={fieldStyle}
            />
          </div>

          {/* Genre musical */}
          <div>
            <label style={labelStyle}>Genre musical principal</label>
            <select
              value={mainGenre}
              onChange={(e) => setMainGenre(e.target.value)}
              style={{ ...fieldStyle, appearance: "none" }}
            >
              <option value="" style={{ backgroundColor: "#1A1A1A" }}>
                Sélectionner un genre…
              </option>
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g} style={{ backgroundColor: "#1A1A1A" }}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Langue des chansons */}
          <div>
            <label style={labelStyle}>Langue principale de vos chansons</label>
            <select
              value={songLanguage}
              onChange={(e) => setSongLanguage(e.target.value)}
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

          {/* Région d'origine */}
          <div>
            <label style={labelStyle}>Région d&apos;origine</label>
            <select
              value={originRegion}
              onChange={(e) => setOriginRegion(e.target.value)}
              style={{ ...fieldStyle, appearance: "none" }}
            >
              <option value="" style={{ backgroundColor: "#1A1A1A" }}>
                Sélectionner une région…
              </option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r} style={{ backgroundColor: "#1A1A1A" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Orange Money ★ obligatoire */}
          <div>
            <label style={labelStyle}>
              Numéro Orange Money ★ <span style={{ color: "#00D26A" }}>*</span>
            </label>
            <input
              type="tel"
              value={orangeMoneyNumber}
              onChange={(e) => setOrangeMoneyNumber(e.target.value)}
              placeholder="+224620000000"
              required
              style={{
                ...fieldStyle,
                borderColor: "rgba(0,210,106,0.4)",
              }}
            />
            <p style={{ fontSize: "11px", color: "rgba(255,165,0,0.7)", marginTop: "5px" }}>
              ★ Sans ce numéro, vous ne pourrez pas recevoir vos revenus.
            </p>
          </div>

          {/* MTN Money (optionnel) */}
          <div>
            <label style={labelStyle}>Numéro MTN Money</label>
            <input
              type="tel"
              value={mtnMoneyNumber}
              onChange={(e) => setMtnMoneyNumber(e.target.value)}
              placeholder="+224660000000 (optionnel)"
              style={fieldStyle}
            />
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
            {loading ? "Enregistrement…" : "Accéder à mon espace artiste →"}
          </button>
        </form>
      </div>
    </div>
  );
}
