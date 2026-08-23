import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@sonafrik/ui/tokens";
import { SUBSCRIPTION_PLANS, TRANSACTION_TYPE_LABELS } from "@sonafrik/types";
import { formatGnf } from "@sonafrik/shared";
import { ScreenHeader } from "../../features/shared/components/ScreenHeader";
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
      <ScreenHeader title="Mon Wallet" subtitle={formatGnf(wallet.balance_gnf)} />

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount} numberOfLines={1}>{formatGnf(wallet.balance_gnf)}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert("Recharger", "Disponible sur l'application web SONAFRIK.", [{ text: "OK" }])}
          >
            <Text style={styles.actionBtnText}>Recharger</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert("Retirer", "Disponible sur l'application web SONAFRIK.", [{ text: "OK" }])}
          >
            <Text style={styles.actionBtnText}>Retirer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.premiumCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.premiumTitle}>
            {isPremium ? "Premium actif" : isInGracePeriod ? "Essai gratuit" : "Accès expiré"}
          </Text>
          <Text style={styles.premiumSub} numberOfLines={2}>
            {isPremium && premiumExpiresAt
              ? `Expire le ${new Date(premiumExpiresAt).toLocaleDateString("fr-FR")}`
              : isInGracePeriod
              ? "7 jours d'essai · Abonnez-vous"
              : "Abonnez-vous pour écouter sans limite"}
          </Text>
        </View>
        {!isPremium ? (
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => subscribePremium("monthly")}>
            <Text style={styles.subscribeBtnText}>S'abonner</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
        )}
      </View>

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
                <Text style={styles.planLabel} numberOfLines={1}>{plan.label}</Text>
                <Text style={styles.planPrice} numberOfLines={1}>{new Intl.NumberFormat("fr-GN").format(plan.price_gnf)} GNF</Text>
                <Text style={styles.planMeta} numberOfLines={1}>{plan.duration_days} jours</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {recentTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernières opérations</Text>
          {recentTransactions.map((tx) => {
            const isCredit = ["royalty_payout", "topup", "refund"].includes(tx.type);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: isCredit ? colors.vertEnergie13 : colors.error13 }]}>
                  <Text style={{ color: isCredit ? colors.vertEnergie : colors.error, fontSize: 12, fontWeight: "700" }}>
                    {isCredit ? "+" : "−"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txLabel} numberOfLines={1}>{TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}</Text>
                  <Text style={styles.txDate} numberOfLines={1}>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</Text>
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
  errorText: { color: colors.texteSecondaire },

  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    backgroundColor: colors.vertProfond,
  },
  balanceLabel: { color: colors.blanc60, fontSize: 13 },
  balanceAmount: { color: colors.textePrincipal, fontSize: 30, fontWeight: "700", marginTop: 4 },
  balanceActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.blanc13,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnText: { color: colors.textePrincipal, fontWeight: "600", fontSize: 14 },

  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
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
    backgroundColor: colors.vertEnergie13,
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

  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txLabel: { color: colors.textePrincipal, fontSize: 14, fontWeight: "500" },
  txDate: { color: colors.texteSecondaire, fontSize: 12, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: "600" },
});
