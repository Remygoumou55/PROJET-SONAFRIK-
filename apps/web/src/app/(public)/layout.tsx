import type { ReactNode } from "react";
import "@/app/styles/landing.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
