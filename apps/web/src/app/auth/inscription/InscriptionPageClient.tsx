"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";

type Step = "phone" | "otp";

export function InscriptionPageClient({ bypassAuth }: { bypassAuth: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [detecting, setDetecting] = useState(!bypassAuth);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const roleParam = searchParams.get("role") as "artist" | "listener" | null;

  useEffect(() => {
    if (bypassAuth) return;
    let cancelled = false;
    void auth.getCurrentProfile().then((profile) => {
      if (cancelled) return;
      if (!profile) { setDetecting(false); return; }
      if (profile.onboarding_completed) {
        const home =
          profile.account_type === "auditeur" ? "/listen"
          : (profile.account_type === "artiste" || profile.account_type === "auditeur_artiste") ? "/creator"
          : "/listen";
        router.replace(home);
        return;
      }
      const dest =
        roleParam === "artist" ? "/onboarding/artist"
        : roleParam === "listener" ? "/onboarding/listener"
        : "/onboarding/role";
      router.replace(dest);
    }).catch(() => {
      if (!cancelled) setDetecting(false);
    });
    return () => { cancelled = true; };
  }, [router, roleParam, bypassAuth]);

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
      if (profile?.onboarding_completed) {
        const home =
          profile.account_type === "auditeur" ? "/listen"
          : profile.account_type === "artiste" || profile.account_type === "auditeur_artiste" ? "/creator"
          : "/listen";
        router.push(home);
        return;
      }
      const dest =
        roleParam === "artist" ? "/onboarding/artist"
        : roleParam === "listener" ? "/onboarding/listener"
        : "/onboarding/role";
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide. Réessayez.");
    }
  }

  if (detecting) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--color-noir-profond)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </main>
    );
  }

  const subtitle =
    roleParam === "artist" ? "Vous rejoignez SONAFRIK en tant qu'artiste"
    : roleParam === "listener" ? "Vous rejoignez SONAFRIK en tant qu'auditeur"
    : "Écoute · Participe · Prospère";

  return (
    <AuthPageShell title="Créer un compte" subtitle={subtitle}>
      {step === "phone" && (
        <>
          <PhoneForm onSubmit={handlePhoneSubmit} />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-bordure)" }} />
            <span className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>ou</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-bordure)" }} />
          </div>
          <GoogleAuthButton label="S'inscrire avec Google" role={roleParam ?? undefined} />
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
        <p className="text-center text-sm" role="alert" style={{ color: "#FF4D4F" }}>{error}</p>
      )}
      <p className="text-center text-sm text-texte-secondaire">
        Déjà un compte ?{" "}
        <Link href="/auth/connexion" className="text-vert-energie hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthPageShell>
  );
}
