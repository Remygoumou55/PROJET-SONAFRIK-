import { redirect } from "next/navigation";

/** Redirige vers la page auth unique — OTP connexion = inscription. */
export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.set(key, value);
    }
  }
  const query = qs.toString();
  redirect(query ? `/auth/connexion?${query}` : "/auth/connexion");
}
