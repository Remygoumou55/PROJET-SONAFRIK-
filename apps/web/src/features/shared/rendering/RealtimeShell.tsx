
import type { ReactNode } from "react";
import { RootLdseShell } from "@/features/shared/ldse/RootLdseShell";

/** FrontiÃ¨re client explicite â€” Ã©vite re-export webpack undefined (.call). */
export function RealtimeShell({ children }: { children: ReactNode }) {
  return <RootLdseShell>{children}</RootLdseShell>;
}
