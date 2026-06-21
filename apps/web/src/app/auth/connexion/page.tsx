import { Suspense } from "react";
import { ConnexionPageClient } from "./ConnexionPageClient";

export const metadata = { title: "Connexion — SONAFRIK" };

export default function ConnexionPage() {
  const bypassAuth = process.env.BYPASS_AUTH === "true";
  return (
    <Suspense>
      <ConnexionPageClient bypassAuth={bypassAuth} />
    </Suspense>
  );
}
