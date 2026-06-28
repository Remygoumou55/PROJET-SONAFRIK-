import { redirect } from "next/navigation";

export default function AdminWithdrawalsRedirectPage() {
  redirect("/admin/finance");
}
