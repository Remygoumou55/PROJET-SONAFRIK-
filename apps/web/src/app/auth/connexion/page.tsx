"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { PhoneForm } from "@/features/auth/components/PhoneForm";
import { useAuthService } from "@/features/auth/hooks/useAuth";

type Step = "phone" | "otp";

export default function ConnexionPage() {
  const router = useRouter();
  const auth = useAuthService();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");

  async function handlePhoneSubmit(p: string) {
    setPhone(p);
    await auth.requestOtp({ phone: p });
    setStep("otp");
  }

  async function handleOtpSubmit(token: string) {
    const { profile } = await auth.verifyOtp({ phone, token });

    if (!profile?.onboarding_completed) {
      router.push("/auth/inscription");
      return;
    }

    await auth.registerCurrentSession({
      platform: "web",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });

    router.push("/profile");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-texte-principal">Connexion</h1>
          <p className="mt-1 text-sm text-texte-secondaire">Entrez votre numéro pour recevoir un code SMS</p>
        </header>

        {step === "phone" && <PhoneForm onSubmit={handlePhoneSubmit} submitLabel="Envoyer le code" />}

        {step === "otp" && (
          <OtpForm
            phone={phone}
            onSubmit={handleOtpSubmit}
            onResend={() => auth.requestOtp({ phone })}
          />
        )}

        <p className="text-center text-sm text-texte-secondaire">
          Pas encore de compte ?{" "}
          <Link href="/auth/inscription" className="text-vert-energie hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
