import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import { SUBSCRIPTION_PLANS, REVENUE_POOL_PERCENT, TRANSACTION_TYPE_LABELS } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { useWallet } from "../../features/wallet/useWallet";

export default function WalletTab() {
  const { context, isLoading, error, subscribePremium } = useWallet();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.vertEnergie} />
      </View>
    );
  }

  if (error || !context) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error ?? "Erreur de chargement"}</Text>
      </View>
    );
  }

  const { wallet, isPremium, isInGracePeriod, premiumExpiresAt, recentTransactions } = context;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mon Wallet</Text>

      {/* Carte solde */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount}>{formatGnf(wallet.balance_gnf)}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert(
              "Recharger",
              "La recharge de wallet est disponible sur l'application web SONAFRIK.",
              [{ text: "OK" }],
            )}
          >
            <Text style={styles.actionBtnText}>Recharger</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert(
              "Retirer",
              "Les retraits sont disponibles sur l'application web SONAFRIK.",
              [{ text: "OK" }],
            )}
          >
            <Text style={styles.actionBtnText}>Retirer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statut premium */}
      <View style={styles.premiumCard}>
        <View style={styles.premiumRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>
              {isPremium ? "Premium actif" : isInGracePeriod ? "Essai gratuit" : "Abonnement expiré"}
            </Text>
            <Text style={styles.premiumSub}>
              {isPremium && premiumExpiresAt
                ? `Expire le ${new Date(premiumExpiresAt).toLocaleDateString("fr-FR")}`
                : isInGracePeriod
                ? "7 jours d'essai · Abonnez-vous"
                : "Abonnez-vous pour écouter"}
            </Text>
          </View>
          {!isPremium && (
            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={() => subscribePremium("monthly")}
            >
              <Text style={styles.subscribeBtnText}>S'abonner</Text>
            </TouchableOpacity>
          )}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}
        </View>
      </View>

      {/* Plans */}
      {!isPremium && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnements</Text>
          <View style={styles.plansRow}>
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <TouchableOpacity
                key={plan.type}
                style={styles.planCard}
                onPress={() => subscribePremium(plan.type)}
              >
                <Text style={styles.planLabel}>{plan.label}</Text>
                <Text style={styles.planPrice}>{new Intl.NumberFormat("fr-GN").format(plan.price_gnf)} GNF</Text>
                <Text style={styles.planMeta}>{plan.duration_days} jours</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Revenue Pool info */}
      <View style={styles.poolCard}>
        <Text style={styles.poolTitle}>Revenue Pool · {REVENUE_POOL_PERCENT}%</Text>
        <Text style={styles.poolSub}>
          {REVENUE_POOL_PERCENT}% des revenus sont redistribués aux artistes selon leurs écoutes valides.
        </Text>
      </View>

      {/* Transactions récentes */}
      {recentTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernières opérations</Text>
          {recentTransactions.map((tx) => {
            const isCredit = ["royalty_payout", "topup", "refund"].includes(tx.type);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: isCredit ? "rgba(0, 210, 106, 0.13)" : "rgba(255, 68, 68, 0.13)" }]}>
                  <Text style={{ color: isCredit ? colors.vertEnergie : "rgba(255, 102, 102, 1)", fontSize: 12, fontWeight: "700" }}>
                    {isCredit ? "+" : "−"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txLabel}>{TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isCredit ? colors.vertEnergie : colors.textePrincipal }]}>
                  {isCredit ? "+" : "−"}{formatGnf(tx.amount_gnf)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.noirProfond },
  content: { padding: 16, paddingBottom: 32 },
  center: { alignItems: "center", justifyContent: "center" },
  title: { color: colors.textePrincipal, fontSize: 22, fontWeight: "700", marginBottom: 16 },
  errorText: { color: colors.texteSecondaire },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    backgroundColor: colors.vertProfond,
  },
  balanceLabel: { color: "rgba(255, 255, 255, 0.60)", fontSize: 13 },
  balanceAmount: { color: colors.textePrincipal, fontSize: 30, fontWeight: "700", marginTop: 4 },
  balanceActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.13)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnText: { color: colors.textePrincipal, fontWeight: "600", fontSize: 14 },
  premiumCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  premiumRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  premiumTitle: { color: colors.textePrincipal, fontSize: 14, fontWeight: "600" },
  premiumSub: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  subscribeBtn: {
    backgroundColor: colors.orSolaire,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subscribeBtnText: { color: colors.noirProfond, fontWeight: "700", fontSize: 13 },
  premiumBadge: {
    backgroundColor: "rgba(0, 210, 106, 0.13)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumBadgeText: { color: colors.vertEnergie, fontSize: 11, fontWeight: "700" },
  section: { marginTop: 12 },
  sectionTitle: {
    color: colors.texteSecondaire,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  plansRow: { flexDirection: "row", gap: 10 },
  planCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  planLabel: { color: colors.textePrincipal, fontWeight: "600", fontSize: 14 },
  planPrice: { color: colors.orSolaire, fontWeight: "700", fontSize: 16, marginTop: 4 },
  planMeta: { color: colors.texteSecondaire, fontSize: 12, marginTop: 2 },
  poolCard: {
    backgroundColor: "rgba(31, 26, 0, 1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 194, 14, 0.20)",
    marginTop: 12,
    marginBottom: 4,
  },
  poolTitle: { color: colors.orSolaire, fontWeight: "600", fontSize: 14 },
  poolSub: { color: colors.texteSecondaire, fontSize: 12, marginTop: 4, lineHeight: 18 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txLabel: { color: colors.textePrincipal, fontSize: 14, fontWeight: "500" },
  txDate: { color: colors.texteSecondaire, fontSize: 12, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: "600" },
});
