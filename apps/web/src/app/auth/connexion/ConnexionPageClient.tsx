"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/features/identity/auth/components/AuthPageShell";
import { GoogleAuthButton } from "@/features/identity/auth/components/GoogleAuthButton";
import { LegalConsentCheckbox } from "@/features/identity/auth/components/LegalConsentCheckbox";
import { OtpForm } from "@/features/identity/auth/components/OtpForm";
import { PhoneForm } from "@/features/identity/auth/components/PhoneForm";
import { useAuthService } from "@/features/identity/auth/hooks/useAuth";

type Step = "phone" | "otp";
type RoleParam = "artist" | "listener" | null;

const AUTH_SUBTITLE = "Écoute · Participe · Prospère";

const BACK_LINK = (
  <Link
    href="/"
    className="inline-flex text-sm text-texte-secondaire transition-colors hover:underline"
  >
    ← Retour à l&apos;accueil
  </Link>
);

function homeForProfile(accountType: string | null | undefined): string {
  if (accountType === "auditeur") return "/listen";
  if (accountType === "artiste" || accountType === "auditeur_artiste") return "/creator";
  return "/listen";
}

function onboardingForRole(role: RoleParam, accountType?: string | null): string {
  if (accountType === "artiste" || accountType === "auditeur_artiste") return "/onboarding/artist";
  if (accountType === "auditeur") return "/onboarding/listener";
  if (role === "artist") return "/onboarding/artist";
  if (role === "listener") return "/onboarding/listener";
  return "/onboarding/role";
}

interface ConnexionPageClientProps {
  bypassAuth: boolean;
  initialRole?: RoleParam;
}

/** Page unique OTP — connexion ET inscription (Supabase signInWithOtp). */
export function ConnexionPageClient({ bypassAuth, initialRole = null }: ConnexionPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [detecting, setDetecting] = useState(!bypassAuth);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [roleParam, setRoleParam] = useState<RoleParam>(initialRole);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "artist" || r === "listener") setRoleParam(r);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      setError("La connexion Google a échoué. Vérifiez que vous avez autorisé l'accès et réessayez.");
      setDetecting(false);
      return;
    }
    if (bypassAuth) {
      setDetecting(false);
      return;
    }
    let cancelled = false;
    void auth.getCurrentProfile().then((profile) => {
      if (cancelled) return;
      if (!profile) {
        setDetecting(false);
        return;
      }
      if (!profile.onboarding_completed) {
        router.replace(onboardingForRole(roleParam, profile.account_type));
        return;
      }
      const next = searchParams.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("/auth")
          ? next
          : homeForProfile(profile.account_type);
      router.replace(dest);
    }).catch(() => {
      if (!cancelled) setDetecting(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, roleParam, bypassAuth]);

  function requireConsent(): boolean {
    if (acceptedTerms) {
      setConsentError(null);
      return true;
    }
    setConsentError("Veuillez accepter les conditions pour continuer");
    return false;
  }

  async function handlePhoneSubmit(p: string) {
    if (!requireConsent()) return;
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
        router.push(onboardingForRole(roleParam, profile?.account_type));
        return;
      }
      auth.registerCurrentSession({
        platform: "web",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }).catch(() => {});
      const next = searchParams.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("/auth")
          ? next
          : homeForProfile(profile.account_type);
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide. Réessayez.");
    }
  }

  if (detecting) {
    return (
      <AuthPageShell
        title="Créer votre compte"
        subtitle={AUTH_SUBTITLE}
        leading={BACK_LINK}
      >
        <div className="flex justify-center py-12" aria-busy="true" aria-label="Chargement">
          <div className="size-8 animate-spin rounded-full border-2 border-vert-energie border-t-transparent" />
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Créer votre compte"
      subtitle={AUTH_SUBTITLE}
      leading={BACK_LINK}
    >
      <p className="text-center text-xs text-texte-desactive">
        Nouveau ou déjà inscrit — votre numéro suffit
      </p>
      {step === "phone" && (
        <>
          <LegalConsentCheckbox
            checked={acceptedTerms}
            error={consentError}
            onChange={(checked) => {
              setAcceptedTerms(checked);
              if (checked) setConsentError(null);
            }}
          />
          <PhoneForm
            onSubmit={handlePhoneSubmit}
            submitDisabled={!acceptedTerms}
            onBlockedSubmit={() =>
              setConsentError("Veuillez accepter les conditions pour continuer")
            }
          />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-bordure" />
            <span className="text-xs text-texte-desactive">ou</span>
            <div className="h-px flex-1 bg-bordure" />
          </div>
          <GoogleAuthButton
            label="Continuer avec Google"
            role={roleParam ?? undefined}
            disabled={!acceptedTerms}
            onDisabledClick={requireConsent}
          />
        </>
      )}
      {step === "otp" && (
        <OtpForm
          phone={phone}
          onSubmit={handleOtpSubmit}
          onResend={() => auth.requestOtp({ phone })}
          onChangePhone={() => {
            setStep("phone");
            setError(null);
          }}
        />
      )}
      {step === "phone" && error && (
        <p className="text-center text-sm text-erreur" role="alert">{error}</p>
      )}
      <p className="text-center text-xs">
        <Link
          href="/auth/mot-de-passe-oublie"
          className="inline-flex items-center gap-1.5 text-vert-energie transition-colors hover:underline"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-4 items-center justify-center rounded-full border-[1.5px] border-vert-energie text-[10px] font-bold"
          >
            ?
          </span>
          Problème d&apos;accès à votre compte ?
        </Link>
      </p>
    </AuthPageShell>
  );
}
