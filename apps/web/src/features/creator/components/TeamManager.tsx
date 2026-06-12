"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@sonafrik/ui";
import type { CreatorTeamMember } from "@sonafrik/types";
import { CREATOR_TEAM_ROLE_LABELS } from "@sonafrik/types";
import { isValidGuineanPhone, GUINEAN_PHONE_ERROR } from "@sonafrik/shared";
import { useCreatorService } from "../hooks/useCreator";

export function TeamManager({ team: initial }: { team: CreatorTeamMember[] }) {
  const router = useRouter();
  const creatorService = useCreatorService();
  const [team, setTeam] = useState(initial);
  const [phone, setPhone] = useState("+224");
  const [role, setRole] = useState<"manager" | "editor" | "accountant" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidGuineanPhone(phone)) {
      setError(GUINEAN_PHONE_ERROR);
      return;
    }

    setLoading(true);
    try {
      const member = await creatorService.inviteTeamMember({ memberPhone: phone, role });
      setTeam((current) => [...current, member]);
      setPhone("+224");
      router.refresh();
    } catch {
      setError("Membre introuvable. Le numéro doit être un compte SONAFRIK existant.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(memberId: string) {
    setLoading(true);
    try {
      await creatorService.removeTeamMember(memberId);
      setTeam((current) => current.filter((m) => m.member_id !== memberId));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <form onSubmit={invite} className="space-y-3">
            <Input
              value={phone}
              maxLength={13}
              placeholder="+224XXXXXXXXX"
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
            />
            {error ? (
              <p className="text-sm" style={{ color: "#FF4444" }} role="alert">
                {error}
              </p>
            ) : null}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="border-bordure bg-elevated text-texte-principal w-full rounded-lg border px-3 py-2 text-sm"
            >
              {(["manager", "editor", "accountant", "viewer"] as const).map((r) => (
                <option key={r} value={r}>
                  {CREATOR_TEAM_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={loading}>
              Inviter par téléphone
            </Button>
          </form>
        </CardContent>
      </Card>

      {team.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-texte-principal font-medium">
                {member.profile?.full_name ?? member.profile?.phone ?? member.member_id}
              </p>
              <Badge variant="outline">{CREATOR_TEAM_ROLE_LABELS[member.role]}</Badge>
            </div>
            {member.role !== "owner" ? (
              <Button size="sm" variant="outline" disabled={loading} onClick={() => remove(member.member_id)}>
                Retirer
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
