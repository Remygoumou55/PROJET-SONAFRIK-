"use client";

import type { ReactNode } from "react";
import { RootLdseShell } from "@/features/shared/ldse/RootLdseShell";

/** Frontière client explicite — évite re-export webpack undefined (.call). */
export function RealtimeShell({ children }: { children: ReactNode }) {
  return <RootLdseShell>{children}</RootLdseShell>;
}
