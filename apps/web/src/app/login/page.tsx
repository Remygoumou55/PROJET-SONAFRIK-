import { redirect } from "next/navigation";

/**
 * Route canonique de connexion.
 * Redirige vers /auth/connexion qui porte le composant OTP SONAFRIK.
 * Utiliser /auth/connexion directement ou /login — les deux fonctionnent.
 */
export default function LoginPage() {
  redirect("/auth/connexion");
}
