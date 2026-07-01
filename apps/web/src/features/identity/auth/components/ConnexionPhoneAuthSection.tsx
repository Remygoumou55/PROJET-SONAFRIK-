"use client";

import { LegalConsentCheckbox } from "./LegalConsentCheckbox";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PhoneForm } from "./PhoneForm";

type RoleParam = "artist" | "listener" | null;

export type ConnexionPhoneAuthSectionProps = {
  roleParam: RoleParam;
  acceptedTerms: boolean;
  consentError: string | null;
  onTermsChange: (checked: boolean) => void;
  onPhoneSubmit: (phone: string) => Promise<void>;
  onRequireConsent: () => boolean;
  onConsentBlocked: () => void;
};

/** Flux OTP SMS legacy — conservé, affiché uniquement si auth_phone_enabled = true. */
export function ConnexionPhoneAuthSection({
  roleParam,
  acceptedTerms,
  consentError,
  onTermsChange,
  onPhoneSubmit,
  onRequireConsent,
  onConsentBlocked,
}: ConnexionPhoneAuthSectionProps) {
  return (
    <>
      <p className="text-center text-xs text-texte-desactive">
        Nouveau ou déjà inscrit — votre numéro suffit
      </p>
      <LegalConsentCheckbox
        checked={acceptedTerms}
        error={consentError}
        onChange={(checked) => {
          onTermsChange(checked);
        }}
      />
      <PhoneForm
        onSubmit={onPhoneSubmit}
        submitDisabled={!acceptedTerms}
        onBlockedSubmit={onConsentBlocked}
      />
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-bordure" />
        <span className="text-xs text-texte-desactive">ou</span>
        <div className="h-px flex-1 bg-bordure" />
      </div>
      <GoogleAuthButton
        label="Continuer avec Google"
        role={roleParam ?? undefined}
        disabled={!acceptedTerms}
        onDisabledClick={onRequireConsent}
      />
    </>
  );
}
