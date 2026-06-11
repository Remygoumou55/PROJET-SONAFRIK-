"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AccountType } from "@sonafrik/types";
import { Button, Input } from "@sonafrik/ui";
import { AuthError } from "@sonafrik/api/auth";
import { AccountTypeSelector } from "@/features/auth/components/AccountTypeSelector";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "role" | "phone" | "otp" | "profile";

export default function InscriptionPage() {
  const router = useRouter();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("role");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Détecte une session Google existante (retour du callback OAuth sans onboarding)
  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user && step === "role") {
          setIsGoogleUser(true);
          const googleName = session.user.user_metadata?.full_name as string | undefined;
          if (googleName) setFullName(googleName);
        }
      });
  }, []);

  async function handlePhoneSubmit(p: string) {
    setPhone(p);
    await auth.requestOtp({ phone: p });
    setStep("otp");
  }

  async function handleOtpSubmit(token: string) {
    const { profile } = await auth.verifyOtp({ phone, token });
    if (profile?.onboarding_completed) {
      router.push("/");
      return;
    }
    setStep("profile");
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) return;
    setError(null);
    setLoading(true);
    try {
      await auth.completeOnboardingForCurrentUser({ accountType, fullName });
      await auth.registerCurrentSession({
        platform: "web",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-texte-principal">Créer un compte</h1>
          <p className="mt-1 text-sm text-texte-secondaire">NOTRE BIEN COMMUN</p>
        </header>

        {step === "role" && (
          <>
            <AccountTypeSelector value={accountType} onChange={setAccountType} />
            <Button
              fullWidth
              disabled={!accountType}
              onClick={() => setStep(isGoogleUser ? "profile" : "phone")}
            >
              Continuer
            </Button>

            {!isGoogleUser && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
                  <span className="text-xs" style={{ color: "#555555" }}>ou</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
                </div>
                <GoogleAuthButton label="S'inscrire avec Google" />
              </>
            )}
          </>
        )}

        {step === "phone" && <PhoneForm onSubmit={handlePhoneSubmit} />}

        {step === "otp" && (
          <OtpForm
            phone={phone}
            onSubmit={handleOtpSubmit}
            onResend={() => auth.requestOtp({ phone })}
          />
        )}

        {step === "profile" && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <Input
              label="Nom complet"
              placeholder="Votre nom"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            {error ? (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" fullWidth isLoading={loading}>
              Terminer l'inscription
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
