import type { ReactNode } from "react";
import { AmbientBackgroundGlow } from "@/components/shared/AmbientBackgroundGlow";
import "@/app/styles/auth-google-only.css";
import "@/app/styles/identity-account.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-page-shell">
      <AmbientBackgroundGlow />
      <div className="app-page-main">{children}</div>
    </div>
  );
}
