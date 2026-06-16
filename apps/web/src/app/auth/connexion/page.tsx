"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";

type Step = "phone" | "otp";

function ConnexionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      setError("La connexion Google a échoué. Vérifiez que vous avez autorisé l'accès et réessayez.");
    }
  }, [searchParams]);

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
    <AuthPageShell title="Connexion" subtitle="Entrez votre numéro pour recevoir un code SMS">
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

        <p className="text-center text-xs" style={{ color: "#555555" }}>
          <Link href="/auth/mot-de-passe-oublie" className="hover:underline" style={{ color: "#555555" }}>
            Problème d&apos;accès à votre compte ?
          </Link>
        </p>
    </AuthPageShell>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionPageInner />
    </Suspense>
  );
}
