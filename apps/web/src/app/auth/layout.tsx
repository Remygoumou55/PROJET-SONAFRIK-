import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <head>
        {/* Google OAuth — préconnecter avant que l'utilisateur clique */}
        <link rel="preconnect" href="https://accounts.google.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
      </head>
      {children}
    </>
  );
}
