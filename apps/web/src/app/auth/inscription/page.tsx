"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AccountType } from "@sonafrik/types";
import { Button, Input } from "@sonafrik/ui";
import { AccountTypeSelector } from "@/features/auth/components/AccountTypeSelector";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "phone" | "otp" | "profile";

export default function InscriptionPage() {
  const router = useRouter();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Retour du callback Google OAuth : session déjà établie, compléter l'onboarding
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Vérifier si l'onboarding est déjà complété (reconnexion Google)
      supabase
        .from("profiles")
        .select("onboarding_completed, full_name")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.onboarding_completed) {
            router.push("/listen");
            return;
          }
          // Nouveau compte Google → pré-remplir le nom et passer au profil
          const name = (profile?.full_name ?? user.user_metadata?.full_name) as string | undefined;
          if (name) setFullName(name);
          setStep("profile");
        });
    });
  }, [router]);

  async function handlePhoneSubmit(p: string) {
    setError(null);
    setLoading(true);
    try {
      setPhone(p);
      await auth.requestOtp({ phone: p });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(token: string) {
    setError(null);
    setLoading(true);
    try {
      const { profile } = await auth.verifyOtp({ phone, token });
      if (profile?.onboarding_completed) {
        router.push("/listen");
        return;
      }
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // RPC non encore dans les types générés — cast explicite
      type RpcFn = (fn: string, args: Record<string, string>) => Promise<{ data: unknown; error: { message: string } | null }>;
      const rpc = supabase.rpc as unknown as RpcFn;
      const { error: rpcError } = await rpc("complete_onboarding", {
        p_full_name: fullName.trim(),
        p_account_type: accountType,
      });

      if (rpcError) {
        setError("Erreur lors de l'inscription. Réessayez.");
        return;
      }

      if (accountType === "auditeur") {
        router.push("/listen");
      } else {
        router.push("/creator");
      }
    } catch {
      setError("Erreur lors de l'inscription. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          {/* Marque SONAFRIK */}
          <div className="mb-4">
            <p className="text-2xl font-extrabold tracking-tight leading-none">
              <span style={{ color: "#FFFFFF" }}>SONA</span>
              <span style={{ color: "#00D26A" }}>FRIK</span>
            </p>
            <p className="text-[9px] font-bold tracking-[0.2em] mt-1" style={{ color: "#FFC20E" }}>
              NOTRE BIEN COMMUN
            </p>
          </div>
          <h1 className="text-2xl font-bold text-texte-principal">Créer un compte</h1>
          <p className="mt-1 text-sm text-texte-secondaire">Écoute · Participe · Prospère</p>
        </header>

        {step === "phone" && (
          <>
            <PhoneForm onSubmit={handlePhoneSubmit} />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
              <span className="text-xs" style={{ color: "#555555" }}>ou</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
            </div>
            <GoogleAuthButton label="S'inscrire avec Google" />
          </>
        )}

        {step === "otp" && (
          <OtpForm
            phone={phone}
            onSubmit={handleOtpSubmit}
            onResend={() => auth.requestOtp({ phone })}
          />
        )}

        {step === "profile" && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
            <AccountTypeSelector value={accountType} onChange={setAccountType} />
            <Input
              label="Nom complet"
              placeholder="Votre nom"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth isLoading={loading} disabled={!accountType || loading}>
              Terminer l&apos;inscription
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-texte-secondaire">
          Déjà un compte ?{" "}
          <Link href="/auth/connexion" className="text-vert-energie hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
