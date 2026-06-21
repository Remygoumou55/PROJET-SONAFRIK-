import { Suspense } from "react";
import { InscriptionPageClient } from "./InscriptionPageClient";

export const metadata = { title: "Inscription — SONAFRIK" };

export default function InscriptionPage() {
  const bypassAuth = process.env.BYPASS_AUTH === "true";
  return (
    <Suspense>
      <InscriptionPageClient bypassAuth={bypassAuth} />
    </Suspense>
  );
}
