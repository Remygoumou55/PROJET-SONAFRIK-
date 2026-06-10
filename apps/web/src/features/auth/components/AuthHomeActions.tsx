"use client";

import Link from "next/link";
import { Button } from "@sonafrik/ui";

export function AuthHomeActions() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <Link href="/auth/inscription">
        <Button fullWidth>Créer un compte</Button>
      </Link>
      <Link href="/auth/connexion">
        <Button fullWidth variant="secondary">
          Se connecter
        </Button>
      </Link>
    </div>
  );
}
