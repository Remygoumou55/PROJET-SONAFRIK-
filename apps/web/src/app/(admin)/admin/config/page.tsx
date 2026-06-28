import { redirect } from "next/navigation";

export default function AdminConfigRedirectPage() {
  redirect("/admin/settings");
}
