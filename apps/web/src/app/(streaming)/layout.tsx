import { StreamingLayoutClient } from "@/features/streaming/components/StreamingLayoutClient";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export default async function StreamingLayout({ children }: { children: React.ReactNode }) {
  await requireIdentityContext();
  return <StreamingLayoutClient>{children}</StreamingLayoutClient>;
}
