import type { AdminPayoutEntry, WithdrawalStatus } from "@sonafrik/types";
import { PAYOUT_ACCOUNT_LABELS, WITHDRAWAL_STATUS_LABELS } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { formatDateTime } from "@/lib/formatters";

export type WithdrawalFilter = WithdrawalStatus | "all";
export type WithdrawalRow = AdminPayoutEntry & Record<string, unknown>;

export interface SelectedWithdrawal {
  id: string;
  artistName: string;
  amount: number;
  method: string;
  action: "approve" | "reject";
}

export const LARGE_WITHDRAWAL_GNF = 1_000_000;
export const OVERDUE_HOURS = 48;

export const FILTERS: { key: WithdrawalFilter; label: string }[] = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvés" },
  { key: "processing", label: "En cours" },
  { key: "completed", label: "Versés" },
  { key: "cancelled", label: "Refusés" },
  { key: "all", label: "Tous" },
];

interface ColumnsHandlers {
  walletBalances: Record<string, number>;
  setSelected: (s: SelectedWithdrawal | null) => void;
}

export function buildAdminWithdrawalsColumns({ walletBalances, setSelected }: ColumnsHandlers) {
  return [
    {
      key: "artist",
      label: "Artiste",
      render: (row: WithdrawalRow) => (
        <div>
          <p className="admin-td-strong">{row.payout_account.display_name}</p>
          <p className="admin-td-muted">{row.user_email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "amount_gnf",
      label: "Montant",
      render: (row: WithdrawalRow) => {
        const isLarge = row.net_amount_gnf >= LARGE_WITHDRAWAL_GNF;
        return (
          <div>
            <p className={`admin-td-strong ${isLarge ? "admin-td-warning" : "admin-td-success"}`}>
              {formatGnf(row.net_amount_gnf)}
            </p>
            {isLarge && <p className="admin-td-warning-sm">Gros retrait</p>}
          </div>
        );
      },
    },
    {
      key: "method",
      label: "Méthode",
      render: (row: WithdrawalRow) => (
        <span>{PAYOUT_ACCOUNT_LABELS[row.payout_account.type] ?? row.payout_account.type}</span>
      ),
    },
    {
      key: "phone",
      label: "Numéro / IBAN",
      render: (row: WithdrawalRow) => (
        <span className="admin-mono">
          {row.payout_account.phone_number ?? row.payout_account.iban ?? "—"}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Solde artiste",
      render: (row: WithdrawalRow) => (
        <span className="admin-td-muted">{formatGnf(walletBalances[row.user_id] ?? 0)}</span>
      ),
    },
    {
      key: "requested_at",
      label: "Demandé le",
      render: (row: WithdrawalRow) => {
        const hoursAgo = Math.floor(
          (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60),
        );
        const isOverdue = hoursAgo > OVERDUE_HOURS && row.status === "pending";
        return (
          <div>
            <p className={isOverdue ? "admin-td-warning" : "admin-td-muted"}>
              {formatDateTime(row.created_at)}
            </p>
            {isOverdue && <p className="admin-td-warning-sm">{hoursAgo}h en attente</p>}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (row: WithdrawalRow) => (
        <span className={`admin-status-badge badge-${row.status}`}>
          {WITHDRAWAL_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "180px",
      render: (row: WithdrawalRow) => {
        if (row.status !== "pending") {
          return (
            <span className="admin-td-muted-sm">
              {row.processed_at ? formatDateTime(row.processed_at) : "—"}
            </span>
          );
        }
        return (
          <div className="admin-moderation-actions">
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={() =>
                setSelected({
                  id: row.id,
                  artistName: row.payout_account.display_name,
                  amount: row.net_amount_gnf,
                  method: row.payout_account.type,
                  action: "approve",
                })
              }
            >
              Approuver
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-danger"
              onClick={() =>
                setSelected({
                  id: row.id,
                  artistName: row.payout_account.display_name,
                  amount: row.net_amount_gnf,
                  method: row.payout_account.type,
                  action: "reject",
                })
              }
            >
              Refuser
            </button>
          </div>
        );
      },
    },
  ];
}
