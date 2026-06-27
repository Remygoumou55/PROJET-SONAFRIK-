import { redirect } from "next/navigation";

export default async function ListenTrackRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/listen?track=${encodeURIComponent(id)}`);
}
