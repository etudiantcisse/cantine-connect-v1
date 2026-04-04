import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getVendorPayouts,
  getVendorWallet,
  getVendorWalletLedger,
  requestVendorPayout,
} from "../services/paymentsService";
import colors from "../theme/colors";
import { formatFcfa } from "../utils/currency";

export default function FinancialReportsScreen({ navigation }) {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [nextWallet, nextLedger, nextPayouts] = await Promise.all([
        getVendorWallet(),
        getVendorWalletLedger(30),
        getVendorPayouts(20),
      ]);
      setWallet(nextWallet);
      setLedger(nextLedger);
      setPayouts(nextPayouts);
    } catch (error) {
      Alert.alert("Rapports", error.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalRevenue = useMemo(
    () =>
      ledger
        .filter((row) => row.entry_type === "credit_sale")
        .reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [ledger],
  );

  const totalPayouts = useMemo(
    () =>
      ledger
        .filter((row) => row.entry_type === "debit_payout")
        .reduce((sum, row) => sum + Math.abs(Number(row.amount || 0)), 0),
    [ledger],
  );

  const requestPayout = async () => {
    try {
      await requestVendorPayout({
        amount: Number(payoutAmount),
        method: "manual",
      });
      setPayoutAmount("");
      Alert.alert(
        "Retrait",
        "Demande enregistree (traitement manuel en attente API paiement).",
      );
      await load();
    } catch (error) {
      Alert.alert("Retrait", error.message ?? "Erreur de retrait");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.navigate("Vendeur Produits")}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Rapports Financiers</Text>
        <View style={{ width: 40 }} />

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Solde vendeur</Text>
            <Text style={styles.summaryValue}>
              {formatFcfa(wallet?.balance ?? 0)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ventes creditees</Text>
            <Text style={styles.summaryValue}>{formatFcfa(totalRevenue)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Retraits demandes</Text>
            <Text style={styles.summaryValue}>{formatFcfa(totalPayouts)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.apiNotice}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color="#1D4ED8"
          />
          <Text style={styles.apiNoticeText}>
            API paiement externe non branchee: confirmations et retraits sont en
            mode manuel/attente.
          </Text>
        </View>

        {/* Payout Request */}
        <View style={styles.payoutCard}>
          <Text style={styles.sectionLabel}>DEMANDER UN RETRAIT</Text>
          <TextInput
            value={payoutAmount}
            onChangeText={setPayoutAmount}
            keyboardType="numeric"
            placeholder="Montant en FCFA"
            placeholderTextColor="#94A3B8"
            style={styles.payoutInput}
          />
          <Pressable
            style={[
              styles.requestBtn,
              (!payoutAmount || loading) && styles.requestBtnDisabled,
            ]}
            onPress={requestPayout}
            disabled={!payoutAmount || loading}
          >
            <Text style={styles.requestBtnText}>Demander retrait</Text>
          </Pressable>
        </View>

        {/* Wallet Ledger */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionLabel}>MOUVEMENTS PORTEFEUILLE</Text>
            <Pressable onPress={load}>
              <Text style={styles.viewAll}>Rafraichir</Text>
            </Pressable>
          </View>

          <View style={styles.transactionsList}>
            {ledger.map((item) => {
              const isCredit = Number(item.amount) > 0;
              return (
                <View key={item.id} style={styles.transactionRow}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: isCredit ? "#DCFCE7" : "#FEE2E2" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isCredit ? "cash-plus" : "cash-minus"}
                      size={20}
                      color={isCredit ? "#16A34A" : "#DC2626"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transactionId}>{item.entry_type}</Text>
                    <Text style={styles.transactionMeta}>
                      {new Date(item.created_at).toLocaleString("fr-FR")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        !isCredit && styles.transactionAmountRefund,
                      ]}
                    >
                      {isCredit ? "+" : ""}
                      {formatFcfa(item.amount)}
                    </Text>
                    <Text style={styles.transactionMethod}>
                      {item.note ?? "Mouvement"}
                    </Text>
                  </View>
                </View>
              );
            })}
            {ledger.length === 0 ? (
              <Text style={styles.emptyText}>
                Aucun mouvement pour le moment.
              </Text>
            ) : null}
          </View>
        </View>

        {/* Payouts */}
        <View style={styles.netCard}>
          <Text style={styles.netTitle}>RETRAITS</Text>
          {payouts.slice(0, 5).map((row) => (
            <View key={row.id} style={styles.netRow}>
              <Text style={styles.netLabel}>
                {new Date(row.created_at).toLocaleDateString("fr-FR")}
              </Text>
              <Text style={styles.netValue}>
                {formatFcfa(row.amount)} - {row.status}
              </Text>
            </View>
          ))}
          {payouts.length === 0 ? (
            <Text style={styles.emptyText}>Aucun retrait.</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.exportWrap}>
        <Pressable style={styles.exportBtn} onPress={load}>
          <MaterialCommunityIcons name="sync" size={20} color="white" />
          <Text style={styles.exportBtnText}>Actualiser les rapports</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#2563EB",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 19,
    textAlign: "center",
  },
  summaryGrid: { width: "100%", flexDirection: "row", gap: 10, marginTop: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginBottom: 4,
  },
  summaryValue: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
  },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 110 },
  apiNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
  },
  apiNoticeText: {
    color: "#1E40AF",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    flex: 1,
  },
  payoutCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  payoutInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Manrope_600SemiBold",
    color: "#1e293b",
  },
  requestBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  requestBtnDisabled: {
    opacity: 0.5,
  },
  requestBtnText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  sectionLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  transactionsSection: { gap: 10 },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: {
    color: "#2563EB",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  transactionsList: { gap: 10 },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionId: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  transactionMeta: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 15,
  },
  transactionAmountRefund: { color: "#DC2626" },
  transactionMethod: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  netCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  netTitle: {
    color: "#64748B",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    color: "#334155",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  netValue: { fontFamily: "Manrope_700Bold", fontSize: 14 },
  exportWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1e293b",
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  exportBtnText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
  },
});
