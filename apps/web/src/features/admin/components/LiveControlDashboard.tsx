import Link from "next/link";
import type { LiveControlSnapshot } from "@sonafrik/api/admin";
import { formatGnf } from "@sonafrik/shared";
import { formatDateTime } from "@/lib/formatters";
import { isTopupEnabled } from "@/features/wallet/lib/paymentsEnabled";
import { LIVE_CONTROL_STYLES } from "@/lib/design/overlayTokens";

interface ChainStep {
  step: string;
  label: string;
  value: number;
  ok: boolean;
  message: string;
}

function buildChainSteps(data: LiveControlSnapshot): ChainStep[] {
  return [
    {
      step: "1",
      label: "Utilisateurs inscrits",
      value: data.totalUsers,
      ok: data.totalUsers > 0,
      message: data.totalUsers > 0 ? `${data.totalUsers} utilisateurs` : "Aucun utilisateur",
    },
    {
      step: "2",
      label: "Morceaux publiés",
      value: data.publishedTracks,
      ok: data.publishedTracks > 0,
      message:
        data.publishedTracks > 0
          ? `${data.publishedTracks} morceaux`
          : "Aucun morceau publié",
    },
    {
      step: "3",
      label: "Écoutes valides (90%+)",
      value: data.validListens,
      ok: data.validListens > 0,
      message:
        data.validListens > 0
          ? `${data.validListens} écoutes valides`
          : "Aucune écoute comptabilisée",
    },
    {
      step: "4",
      label: "Cycles royalties",
      value: data.royaltyCycles,
      ok: data.royaltyCycles > 0,
      message:
        data.royaltyCycles > 0
          ? `${data.royaltyCycles} cycles exécutés`
          : "Aucun cycle déclenché",
    },
    {
      step: "5",
      label: "Entrées wallet ledger",
      value: data.ledgerEntries,
      ok: data.ledgerEntries > 0,
      message:
        data.ledgerEntries > 0
          ? `${data.ledgerEntries} crédits en base`
          : "Aucun crédit distribué",
    },
  ];
}

interface Props {
  data: LiveControlSnapshot;
}

export function LiveControlDashboard({ data }: Props) {
  const chainSteps = buildChainSteps(data);
  const allGreen = chainSteps.every((s) => s.ok);
  const paymentsEnabled = isTopupEnabled();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-texte-principal)" }}>
          Live Control MVP
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
          État de la chaîne MVP en temps réel — actualiser la page pour mettre à jour
        </p>
      </div>

      {!paymentsEnabled && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={LIVE_CONTROL_STYLES.warnBanner}
        >
          Paiements désactivés : définir <code>NEXT_PUBLIC_PAYMENTS_ENABLED=true</code> dans{" "}
          <code>apps/web/.env.local</code> puis relancer <code>pnpm dev</code>.
        </p>
      )}

      <div
        className="rounded-2xl p-5 text-center"
        style={allGreen ? LIVE_CONTROL_STYLES.okShell : LIVE_CONTROL_STYLES.errShell}
      >
        <p className="text-4xl">{allGreen ? "✅" : "⏳"}</p>
        <p className="mt-2 text-xl font-bold" style={{ color: "var(--color-texte-principal)" }}>
          {allGreen ? "SONAFRIK EST PRÊT POUR LA BÊTA" : "Chaîne MVP en cours de validation"}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
          {chainSteps.filter((s) => s.ok).length}/{chainSteps.length} étapes validées
        </p>
      </div>

      <section className="space-y-2">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-texte-desactive)" }}
        >
          Chaîne MVP
        </h2>
        {chainSteps.map((step) => (
          <div
            key={step.step}
            className="flex items-center gap-4 rounded-xl px-4 py-3"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-bordure)",
            }}
          >
            <span className="text-xl">{step.ok ? "✅" : "⏳"}</span>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
                Étape {step.step} — {step.label}
              </p>
              <p
                className="text-xs"
                style={{ color: step.ok ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}
              >
                {step.message}
              </p>
            </div>
            <span
              className="text-xl font-bold tabular-nums"
              style={{ color: step.ok ? "var(--color-vert-energie)" : "var(--color-texte-desactive)" }}
            >
              {step.value}
            </span>
          </div>
        ))}
      </section>

      {data.recentTracks.length > 0 && (
        <section className="space-y-2">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-texte-desactive)" }}
          >
            Morceaux publiés récents
          </h2>
          {data.recentTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between rounded-lg px-4 py-2 text-sm"
              style={{ backgroundColor: "var(--color-elevated)" }}
            >
              <span style={{ color: "var(--color-texte-principal)" }}>🎵 {track.title}</span>
              <span style={{ color: "var(--color-vert-energie)" }}>✅ {track.publication_status}</span>
            </div>
          ))}
        </section>
      )}

      {data.recentLedger.length > 0 && (
        <section className="space-y-2">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-texte-desactive)" }}
          >
            Derniers crédits wallet
          </h2>
          {data.recentLedger.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg px-4 py-2 text-sm"
              style={{ backgroundColor: "var(--color-elevated)" }}
            >
              <span style={{ color: "var(--color-texte-principal)" }}>{entry.entry_type}</span>
              <span style={{ color: "var(--color-vert-energie)" }}>{formatGnf(entry.amount_gnf)}</span>
              <span className="text-xs" style={{ color: "var(--color-texte-desactive)" }}>
                {formatDateTime(entry.created_at)}
              </span>
            </div>
          ))}
        </section>
      )}

      <section
        className="rounded-2xl p-5 space-y-3"
        style={LIVE_CONTROL_STYLES.warnSection}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--color-or-solaire)" }}>
          Guide étape par étape
        </h2>
        {[
          {
            num: "0",
            text: "Se connecter avec remygoumou55@gmail.com ou votre téléphone (+223…)",
            link: "/auth/connexion" as const,
          },
          {
            num: "1",
            text: "Aller sur /listen et écouter un morceau jusqu'à 90% de la durée",
            link: "/listen" as const,
          },
          {
            num: "2",
            text: "Revenir ici et vérifier que « Écoutes valides » a augmenté",
            link: null,
          },
          {
            num: "3",
            text: "Aller sur /admin/finance et cliquer « ▶ Déclencher un cycle royalties »",
            link: "/admin/finance" as const,
          },
          {
            num: "4",
            text: "Actualiser cette page — « Cycles royalties » et « wallet ledger » doivent augmenter",
            link: null,
          },
          {
            num: "5",
            text: "Ouvrir /wallet/payout — formulaire visible (retrait grisé sans credentials opérateur)",
            link: "/wallet/payout" as const,
          },
        ].map((item) => (
          <div key={item.num} className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: LIVE_CONTROL_STYLES.warnPill.backgroundColor,
                color: "var(--color-or-solaire)",
              }}
            >
              {item.num}
            </span>
            <div>
              <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
                {item.text}
              </p>
              {item.link && (
                <Link href={item.link} className="text-xs font-medium text-[var(--t8-primary-lavender)] hover:underline">
                  → Ouvrir
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
