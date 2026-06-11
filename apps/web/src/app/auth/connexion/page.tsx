"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";

type Step = "phone" | "otp";

export default function ConnexionPage() {
  const router = useRouter();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handlePhoneSubmit(p: string) {
    setError(null);
    try {
      setPhone(p);
      await auth.requestOtp({ phone: p });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code. Réessayez.");
    }
  }

  async function handleOtpSubmit(token: string) {
    setError(null);
    try {
      const { profile } = await auth.verifyOtp({ phone, token });

      if (!profile?.onboarding_completed) {
        router.push("/auth/inscription");
        return;
      }

      auth.registerCurrentSession({
        platform: "web",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }).catch(() => {});

      router.push("/listen");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide. Réessayez.");
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
          <h1 className="text-2xl font-bold text-texte-principal">Connexion</h1>
          <p className="mt-1 text-sm text-texte-secondaire">Entrez votre numéro pour recevoir un code SMS</p>
        </header>

        {step === "phone" && (
          <>
            <PhoneForm onSubmit={handlePhoneSubmit} submitLabel="Envoyer le code" />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
              <span className="text-xs" style={{ color: "#555555" }}>ou</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
            </div>
            <GoogleAuthButton label="Se connecter avec Google" />
          </>
        )}

        {step === "otp" && (
          <OtpForm
            phone={phone}
            onSubmit={handleOtpSubmit}
            onResend={() => auth.requestOtp({ phone })}
          />
        )}

        {error && (
          <p className="text-center text-sm" style={{ color: "#FF4D4F" }}>{error}</p>
        )}

        <p className="text-center text-sm text-texte-secondaire">
          Pas encore de compte ?{" "}
          <Link href="/auth/inscription" className="text-vert-energie hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
