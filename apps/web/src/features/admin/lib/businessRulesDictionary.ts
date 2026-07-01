/** Métadonnées UX — Config Règles Métiers (clés techniques jamais affichées). */

export type BusinessRuleCriticality = "low" | "medium" | "critical";

export type BusinessRuleModule = {
  id: string;
  label: string;
  href: string;
};

export type BusinessRuleMeta = {
  icon: string;
  label: string;
  explanation: string;
  criticality: BusinessRuleCriticality;
  modules: BusinessRuleModule[];
  searchAliases: string[];
};

const MODULES = {
  streaming: { id: "streaming", label: "Streaming", href: "/admin/analytics" },
  wallet: { id: "wallet", label: "Portefeuille", href: "/admin/finance" },
  royalties: { id: "royalties", label: "Royalties", href: "/admin/revenue" },
  payments: { id: "payments", label: "Paiements", href: "/admin/finance" },
  catalog: { id: "catalog", label: "Catalogue", href: "/admin/catalog" },
  creator: { id: "creator", label: "Créateurs", href: "/admin/artists" },
  admin: { id: "admin", label: "Administration", href: "/admin" },
  launch: { id: "launch", label: "Lancement", href: "/lancement" },
} as const satisfies Record<string, BusinessRuleModule>;

export const BUSINESS_RULES_DICTIONARY: Record<string, BusinessRuleMeta> = {
  stream_min_duration_seconds: {
    icon: "🎧",
    label: "Durée minimale d'une écoute valide",
    explanation:
      "Cette règle évite que les écoutes trop courtes soient comptabilisées dans les revenus des artistes.",
    criticality: "critical",
    modules: [MODULES.streaming, MODULES.royalties, MODULES.wallet],
    searchAliases: ["stream", "écoute", "real listen", "durée", "revenu"],
  },
  stream_heartbeat_interval_s: {
    icon: "❤️",
    label: "Vérification automatique des écoutes",
    explanation:
      "Fréquence à laquelle la plateforme vérifie qu'une écoute est toujours en cours. Impacte la fiabilité des statistiques.",
    criticality: "medium",
    modules: [MODULES.streaming],
    searchAliases: ["heartbeat", "stream", "intervalle", "pulse"],
  },
  revenue_pool_creator_percent: {
    icon: "💰",
    label: "Part reversée aux créateurs",
    explanation:
      "Définit le pourcentage des revenus reversé automatiquement aux artistes via le pool de royalties (CDC : 65 %).",
    criticality: "critical",
    modules: [MODULES.wallet, MODULES.royalties, MODULES.payments],
    searchAliases: ["revenu", "royalties", "65", "pool", "créateur", "artiste"],
  },
  tip_commission_percent: {
    icon: "💸",
    label: "Commission sur les pourboires",
    explanation:
      "Part prélevée par SONAFRIK sur chaque pourboire envoyé à un artiste. Le reste est crédité au créateur.",
    criticality: "medium",
    modules: [MODULES.wallet, MODULES.payments, MODULES.creator],
    searchAliases: ["tip", "pourboire", "commission"],
  },
  beat_commission_percent: {
    icon: "🎹",
    label: "Commission sur les beats",
    explanation: "Part prélevée sur les ventes de beats. À 0 %, l'artiste reçoit l'intégralité du montant.",
    criticality: "low",
    modules: [MODULES.catalog, MODULES.wallet],
    searchAliases: ["beat", "store", "commission"],
  },
  premium_price_monthly_gnf: {
    icon: "⭐",
    label: "Prix Premium mensuel",
    explanation: "Montant mensuel de l'abonnement Premium affiché aux auditeurs, en francs guinéens.",
    criticality: "medium",
    modules: [MODULES.wallet, MODULES.payments],
    searchAliases: ["premium", "abonnement", "prix", "gnf"],
  },
  max_upload_size_mb: {
    icon: "📤",
    label: "Taille maximale des uploads",
    explanation: "Limite la taille des fichiers audio que les artistes peuvent publier sur la plateforme.",
    criticality: "low",
    modules: [MODULES.catalog, MODULES.creator],
    searchAliases: ["upload", "taille", "mo", "catalogue"],
  },
  tip_amounts_gnf: {
    icon: "🎁",
    label: "Montants de pourboire autorisés",
    explanation: "Liste des montants proposés aux auditeurs lorsqu'ils envoient un pourboire à un artiste.",
    criticality: "low",
    modules: [MODULES.wallet, MODULES.payments],
    searchAliases: ["tip", "pourboire", "montant"],
  },
  launch_subscriber_target: {
    icon: "🚀",
    label: "Objectif minimum avant lancement officiel",
    explanation:
      "Nombre d'abonnés payants requis avant d'ouvrir la plateforme au public (objectif stratégique lancement).",
    criticality: "medium",
    modules: [MODULES.launch, MODULES.admin],
    searchAliases: ["lancement", "launch", "abonné", "objectif"],
  },
  free_trial_days: {
    icon: "🎁",
    label: "Jours d'écoute gratuits",
    explanation: "Durée de la période d'essai gratuite offerte aux nouveaux auditeurs Premium.",
    criticality: "low",
    modules: [MODULES.wallet, MODULES.streaming],
    searchAliases: ["essai", "trial", "gratuit"],
  },
  grace_period_days: {
    icon: "⏳",
    label: "Période de grâce abonnement",
    explanation: "Nombre de jours après expiration avant suspension de l'accès Premium.",
    criticality: "medium",
    modules: [MODULES.wallet],
    searchAliases: ["grâce", "abonnement", "premium"],
  },
  min_withdrawal_gnf: {
    icon: "🏦",
    label: "Retrait minimum artiste",
    explanation: "Montant minimum qu'un artiste doit atteindre avant de demander un retrait.",
    criticality: "medium",
    modules: [MODULES.wallet, MODULES.payments],
    searchAliases: ["retrait", "withdrawal", "minimum"],
  },
  max_stream_sessions: {
    icon: "📊",
    label: "Sessions d'écoute simultanées max",
    explanation: "Limite anti-abus du nombre de sessions actives par auditeur.",
    criticality: "medium",
    modules: [MODULES.streaming],
    searchAliases: ["session", "stream", "simultané"],
  },
  revenue_pool_percent: {
    icon: "💰",
    label: "Part du pool de revenus",
    explanation: "Pourcentage du chiffre d'affaires alloué au pool distribué aux créateurs.",
    criticality: "critical",
    modules: [MODULES.royalties, MODULES.wallet],
    searchAliases: ["revenu", "pool", "royalties"],
  },
  beat_store_commission_percent: {
    icon: "🎹",
    label: "Commission Beat Store",
    explanation: "Commission prélevée sur les ventes du Beat Store.",
    criticality: "low",
    modules: [MODULES.catalog, MODULES.wallet],
    searchAliases: ["beat", "store", "commission"],
  },
};

export const CRITICALITY_LABELS: Record<
  BusinessRuleCriticality,
  { badge: string; label: string; className: string }
> = {
  low: { badge: "🟢", label: "Faible impact", className: "br-criticality--low" },
  medium: { badge: "🟡", label: "Impact moyen", className: "br-criticality--medium" },
  critical: { badge: "🔴", label: "Impact critique", className: "br-criticality--critical" },
};

/** Libellé humain — fallback sans exposer la clé technique brute. */
export function getBusinessRuleMeta(key: string, dbDescription: string | null): BusinessRuleMeta {
  const known = BUSINESS_RULES_DICTIONARY[key];
  if (known) return known;

  const humanized = key
    .replace(/_ms$/, "")
    .replace(/_gnf$/, " (GNF)")
    .replace(/_percent$/, " (%)")
    .replace(/_seconds$/, " (secondes)")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    icon: "⚙️",
    label: humanized,
    explanation: dbDescription ?? "Paramètre système SONAFRIK — consultez l'équipe technique avant modification.",
    criticality: "medium",
    modules: [MODULES.admin],
    searchAliases: [key.replace(/_/g, " ")],
  };
}

export function isCriticalRule(key: string): boolean {
  const meta = BUSINESS_RULES_DICTIONARY[key];
  return meta?.criticality === "critical";
}

export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesBusinessRuleSearch(
  key: string,
  meta: BusinessRuleMeta,
  dbDescription: string | null,
  query: string,
): boolean {
  if (!query) return true;
  const q = normalizeSearchText(query);
  const haystack = normalizeSearchText(
    [meta.label, meta.explanation, dbDescription ?? "", ...meta.searchAliases, key].join(" "),
  );
  return haystack.includes(q);
}
