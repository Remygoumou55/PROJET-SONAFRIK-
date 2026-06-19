"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "phone" | "otp";

function InscriptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [detecting, setDetecting] = useState(true);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Paramètre rôle depuis la landing page ou l'URL
  const roleParam = searchParams.get("role") as "artist" | "listener" | null;

  // Détection de session active au montage
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) { setDetecting(false); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type, onboarding_completed")
          .eq("id", user.id)
          .single();

        if (cancelled) return;
        if (profile?.onboarding_completed) {
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
      } catch {
        // Supabase indisponible ou clé manquante en dev → afficher le formulaire
        if (!cancelled) setDetecting(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [router, roleParam]);

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
          profile.account_type === "auditeur"
            ? "/listen"
            : profile.account_type === "artiste" ||
                profile.account_type === "auditeur_artiste"
              ? "/creator"
              : "/listen";
        router.push(home);
        return;
      }

      // Rediriger vers l'onboarding selon le rôle fourni ou choisir
      const dest =
        roleParam === "artist"
          ? "/onboarding/artist"
          : roleParam === "listener"
            ? "/onboarding/listener"
            : "/onboarding/role";
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide. Réessayez.");
    }
  }

  // Détection session en cours — spinner minimal
  if (detecting) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "#0D0D0D" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#00D26A", borderTopColor: "transparent" }}
        />
      </main>
    );
  }

  const subtitle =
    roleParam === "artist"
      ? "Vous rejoignez SONAFRIK en tant qu'artiste"
      : roleParam === "listener"
        ? "Vous rejoignez SONAFRIK en tant qu'auditeur"
        : "Écoute · Participe · Prospère";

  return (
    <AuthPageShell title="Créer un compte" subtitle={subtitle}>
      {step === "phone" && (
        <>
          <PhoneForm onSubmit={handlePhoneSubmit} />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
            <span className="text-xs" style={{ color: "#555555" }}>ou</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
          </div>
          <GoogleAuthButton
            label="S'inscrire avec Google"
            role={roleParam ?? undefined}
          />
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
        <p className="text-center text-sm" role="alert" style={{ color: "#FF4D4F" }}>
          {error}
        </p>
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

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionPageInner />
    </Suspense>
  );
}
