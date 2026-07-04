import { redirect } from "next/navigation";

/** Redirection legacy — nav MVP pointe vers /creator/catalog (audit A-001). */
export default function CreatorPublicationsRedirectPage() {
  redirect("/creator/catalog");
}
