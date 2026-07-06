"use server";

import type {
  AdminAwardsDashboard,
  AdminRevenueDashboardData,
  PendingCatalogItem,
} from "@sonafrik/api/admin";
import type {
  AdminArtistsFilter,
  AdminArtistsListResult,
  AdminPayoutEntry,
  AdminUsersFilter,
  AdminUsersListResult,
} from "@sonafrik/types";
import { isValidContentName } from "@/lib/content-filter";
import {
  getAdminServiceForAction,
  getPayoutServiceForAction,
  type AdminActionResult,
} from "@/features/admin/lib/getAdminActionContext";

type PayoutQueueStatus = "pending" | "approved" | "processing" | "completed" | "cancelled" | "all";

function normalizePayoutQueueStatus(status?: string): PayoutQueueStatus {
  if (
    status === "approved" ||
    status === "processing" ||
    status === "completed" ||
    status === "cancelled" ||
    status === "all"
  ) {
    return status;
  }
  return "pending";
}

export async function loadAdminUsersListAction(input: {
  q?: string;
  filter?: AdminUsersFilter;
  page?: number;
}): Promise<AdminActionResult<AdminUsersListResult>> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) {
    return { error: ctx.error, users: [], total: 0, page: 1, limit: 20 };
  }

  try {
    return await ctx.service.listUsers({
      q: input.q,
      filter: input.filter === "all" ? undefined : input.filter,
      page: input.page ?? 1,
    });
  } catch {
    return { error: "Impossible de recharger la liste utilisateurs.", users: [], total: 0, page: 1, limit: 20 };
  }
}

export async function loadAdminArtistsListAction(input: {
  q?: string;
  filter?: AdminArtistsFilter;
  page?: number;
}): Promise<AdminActionResult<AdminArtistsListResult>> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) {
    return { error: ctx.error, artists: [], total: 0, page: 1, limit: 20 };
  }

  try {
    return await ctx.service.listArtists({
      q: input.q,
      filter: input.filter === "all" ? undefined : input.filter,
      page: input.page ?? 1,
    });
  } catch {
    return { error: "Impossible de recharger la liste artistes.", artists: [], total: 0, page: 1, limit: 20 };
  }
}

export async function loadAdminPendingCatalogAction(): Promise<
  AdminActionResult<{ items: PendingCatalogItem[] }>
> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error, items: [] };

  try {
    const items = await ctx.service.listPendingCatalogItems();
    return { items };
  } catch {
    return { error: "Impossible de recharger la file de modération.", items: [] };
  }
}

export async function loadAdminWithdrawalsQueueAction(input: {
  status?: string;
  limit?: number;
}): Promise<AdminActionResult<{ queue: AdminPayoutEntry[] }>> {
  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error, queue: [] };

  try {
    const status = normalizePayoutQueueStatus(input.status);
    const queue = await ctx.service.getAdminPayoutQueue({
      status,
      limit: input.limit ?? 200,
    });
    return { queue };
  } catch {
    return { error: "Impossible de recharger la file de retraits.", queue: [] };
  }
}

export async function loadAdminRevenueDashboardAction(): Promise<
  AdminActionResult<{ data: AdminRevenueDashboardData }>
> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error, data: {} as AdminRevenueDashboardData };

  try {
    const data = await ctx.service.getRevenueDashboardData();
    return { data };
  } catch {
    return { error: "Impossible de recharger le tableau revenus.", data: {} as AdminRevenueDashboardData };
  }
}

export async function loadAdminAwardsDashboardAction(): Promise<
  AdminActionResult<{ data: AdminAwardsDashboard }>
> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) {
    return {
      error: ctx.error,
      data: {
        activeEdition: null,
        nomineesByCategory: {},
        totalNominees: 0,
        fundBalance: 0,
        fundHistory: [],
        pastEditions: [],
        categories: [],
      },
    };
  }

  try {
    const raw = await ctx.service.getAwardsDashboard();
    const nomineesByCategory: AdminAwardsDashboard["nomineesByCategory"] = {};
    let totalNominees = 0;

    for (const [cat, nominees] of Object.entries(raw.nomineesByCategory)) {
      const filtered = nominees.filter((n) => isValidContentName(n.stageName));
      if (filtered.length > 0) {
        nomineesByCategory[cat] = filtered;
        totalNominees += filtered.length;
      }
    }

    return {
      data: {
        ...raw,
        nomineesByCategory,
        totalNominees,
        categories: raw.categories.filter((c) => isValidContentName(c.name)),
      },
    };
  } catch {
    return {
      error: "Impossible de recharger le module Awards.",
      data: {
        activeEdition: null,
        nomineesByCategory: {},
        totalNominees: 0,
        fundBalance: 0,
        fundHistory: [],
        pastEditions: [],
        categories: [],
      },
    };
  }
}
