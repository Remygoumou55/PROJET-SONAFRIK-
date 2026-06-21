import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminRightsCenter, type ClaimWithContext } from "@/features/admin/components/AdminRightsCenter";
import type { RightsClaimType, RightsClaimStatus } from "@sonafrik/types";

export const metadata = { title: "Droits — Admin SONAFRIK" };

interface RawClaimRow {
  id: string;
  work_id: string;
  claimant_id: string;
  claim_type: RightsClaimType;
  status: RightsClaimStatus;
  description: string;
  evidence_url: string | null;
  created_at: string;
  works: { title: string } | null;
  profiles: { full_name: string | null } | null;
}

export default async function AdminRightsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("rights_claims")
    .select(
      "id, work_id, claimant_id, claim_type, status, description, evidence_url, created_at, works(title), profiles!claimant_id(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const initialClaims: ClaimWithContext[] = ((data ?? []) as unknown as RawClaimRow[]).map(
    (row) => ({
      id:            row.id,
      work_id:       row.work_id,
      work_title:    row.works?.title ?? "—",
      claimant_id:   row.claimant_id,
      claimant_name: row.profiles?.full_name ?? null,
      claim_type:    row.claim_type,
      status:        row.status,
      description:   row.description,
      evidence_url:  row.evidence_url,
      created_at:    row.created_at,
    }),
  );

  return <AdminRightsCenter initialClaims={initialClaims} />;
}
