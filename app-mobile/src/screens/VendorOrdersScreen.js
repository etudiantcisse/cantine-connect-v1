import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ORDER_STATUS, ORDER_STATUS_LABEL } from "../constants/orders";
import { useAuth } from "../hooks/useAuth";
import {
  getVendorByProfile,
  getVendorOrders,
  updateVendorOrderStatus,
} from "../services/vendorService";
import { markOrderPaid } from "../services/paymentsService";
import { supabase } from "../lib/supabase";
import colors from "../theme/colors";
import { formatFcfa } from "../utils/currency";

const STATUS_CONFIG = {
  [ORDER_STATUS.EN_ATTENTE]: {
    color: "#EF4444",
    bg: "#FEF2F2",
    label: "En attente",
    border: "#EF4444",
  },
  [ORDER_STATUS.EN_PREPARATION]: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    label: "En préparation",
    border: "#F59E0B",
  },
  [ORDER_STATUS.PRETE]: {
    color: "#10B981",
    bg: "#F0FDF4",
    label: "Prête",
    border: "#10B981",
  },
  [ORDER_STATUS.LIVREE]: {
    color: "#64748B",
    bg: "#F8FAFC",
    label: "Livrée",
    border: "#E2E8F0",
  },
};

const TABS = ["Tout", "En attente", "En préparation", "Prête"];

function OrderDetailModal({
  order,
  visible,
  onClose,
  onStatusChange,
  onMarkPaid,
}) {
  if (!order) return null;
  const config =
    STATUS_CONFIG[order.status] ?? STATUS_CONFIG[ORDER_STATUS.EN_ATTENTE];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modal.container}>
        <View style={modal.header}>
          <Pressable style={modal.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color="#334155"
            />
          </Pressable>
          <Text style={modal.title}>Détails de la commande</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Overview */}
        <View style={modal.overviewCard}>
          <View style={modal.overviewRow}>
            <View>
              <Text style={modal.overviewSubtitle}>Client</Text>
              <Text style={modal.overviewName}>
                {order.profiles
                  ? `${order.profiles.prenom ?? ""} ${order.profiles.nom ?? ""}`.trim()
                  : (order.user_id?.slice(0, 8) ?? "Client")}
              </Text>
            </View>
            <View style={[modal.idBadge]}>
              <Text style={modal.idBadgeText}>#{order.id.slice(0, 6)}</Text>
            </View>
          </View>
          <View style={modal.overviewTimeRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color="#64748B"
            />
            <Text style={modal.overviewTime}>Retrait prévu : 12:30</Text>
          </View>
        </View>

        {/* Items */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={modal.content}>
          <Text style={modal.sectionTitle}>Articles à préparer</Text>
          <View style={modal.itemsList}>
            {(order.order_items ?? []).map((row) => (
              <View key={row.id} style={modal.itemRow}>
                <View style={modal.itemQtyBadge}>
                  <Text style={modal.itemQty}>{row.quantite}x</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modal.itemName}>
                    {row.products?.nom ?? "Produit"}
                  </Text>
                  <Text style={modal.itemSub}>Article de commande</Text>
                </View>
                <MaterialCommunityIcons
                  name="checkbox-blank-outline"
                  size={24}
                  color="#CBD5E1"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={modal.footer}>
          <View style={modal.statusToggleRow}>
            <View>
              <Text style={modal.statusToggleLabel}>État de préparation</Text>
              <Text style={[modal.statusToggleValue, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            <View>
              <Text style={modal.statusToggleLabel}>Paiement</Text>
              <Text
                style={[
                  modal.statusToggleValue,
                  {
                    color:
                      order.payment_status === "paid" ? "#10B981" : "#F59E0B",
                  },
                ]}
              >
                {order.payment_status === "paid" ? "Confirmé" : "En attente"}
              </Text>
            </View>
          </View>

          {order.payment_status !== "paid" && typeof onMarkPaid === "function" ? (
            <Pressable
              style={[modal.actionBtn, { backgroundColor: "#2563EB" }]}
              onPress={() => {
                onMarkPaid(order.id);
                onClose();
              }}
            >
              <Text style={modal.actionBtnText}>Marquer paiement reçu</Text>
            </Pressable>
          ) : null}

          {order.status === ORDER_STATUS.EN_ATTENTE && (
            <Pressable
              style={modal.actionBtn}
              onPress={() => {
                onStatusChange(order.id, ORDER_STATUS.EN_PREPARATION);
                onClose();
              }}
            >
              <Text style={modal.actionBtnText}>Accepter & Préparer</Text>
            </Pressable>
          )}
          {order.status === ORDER_STATUS.EN_PREPARATION && (
            <Pressable
              style={[modal.actionBtn, { backgroundColor: "#F59E0B" }]}
              onPress={() => {
                onStatusChange(order.id, ORDER_STATUS.PRETE);
                onClose();
              }}
            >
              <Text style={modal.actionBtnText}>Marquer comme Prête</Text>
            </Pressable>
          )}
          {order.status === ORDER_STATUS.PRETE && (
            <Pressable
              style={[modal.actionBtn, { backgroundColor: "#10B981" }]}
              onPress={() => {
                onStatusChange(order.id, ORDER_STATUS.LIVREE);
                onClose();
              }}
            >
              <Text style={modal.actionBtnText}>Notifier le client</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function VendorOrdersScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tout");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const vendor = await getVendorByProfile(user.id);
      if (!vendor?.id) {
        setOrders([]);
        setVendorId(null);
        return;
      }
      setVendorId(vendor.id);
      const list = await getVendorOrders(vendor.id);
      setOrders(list);
    } catch (error) {
      Alert.alert("Commandes", error.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!vendorId) {
      return;
    }

    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendorId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    [orders],
  );

  const statusCount = useMemo(
    () =>
      orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === "Tout") return orders;
    const map = {
      "En attente": ORDER_STATUS.EN_ATTENTE,
      "En préparation": ORDER_STATUS.EN_PREPARATION,
      Prête: ORDER_STATUS.PRETE,
    };
    return orders.filter((o) => o.status === map[activeTab]);
  }, [orders, activeTab]);

  const changeStatus = async (orderId, status) => {
    try {
      await updateVendorOrderStatus(orderId, status);
      await load();
    } catch (error) {
      Alert.alert("Commande", error.message ?? "Erreur de mise à jour");
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      await markOrderPaid(orderId, `manual-${Date.now()}`);
      await load();
      Alert.alert("Paiement", "Paiement marque comme confirme.");
    } catch (error) {
      Alert.alert("Paiement", error.message ?? "Erreur de confirmation");
    }
  };

  if (!vendorId && !loading) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons
          name="storefront-outline"
          size={56}
          color="#CBD5E1"
        />
        <Text style={styles.centerTitle}>Aucune cantine vendeur</Text>
        <Text style={styles.centerText}>
          Créez votre cantine dans l'onglet Produits vendeur.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.storeBadge}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View>
            <Text style={styles.appName}>Cantine Connectée</Text>
            <Text style={styles.branch}>Dashboard vendeur</Text>
          </View>
        </View>
        <Pressable style={styles.notifBtn} onPress={load}>
          <MaterialCommunityIcons name="refresh" size={22} color="#334155" />
        </Pressable>
      </View>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.kpiPrimary]}>
          <MaterialCommunityIcons
            name="currency-usd"
            size={20}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.kpiPrimaryLabel}>REVENUE TOTAL</Text>
          <Text style={styles.kpiPrimaryValue}>{formatFcfa(totalRevenue)}</Text>
          <View style={styles.kpiBadge}>
            <Text style={styles.kpiBadgeText}>+12%</Text>
          </View>
        </View>
        <View style={styles.kpiCard}>
          <MaterialCommunityIcons
            name="receipt"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.kpiLabel}>COMMANDES</Text>
          <Text style={styles.kpiValue}>{orders.length}</Text>
          <View
            style={[
              styles.kpiBadge,
              { backgroundColor: "rgba(244,140,37,0.1)" },
            ]}
          >
            <Text style={[styles.kpiBadgeText, { color: colors.primary }]}>
              +5%
            </Text>
          </View>
        </View>
      </View>

      {/* Status Overview */}
      <View style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <Text style={styles.statusCardTitle}>ÉTAT DES COMMANDES</Text>
          <MaterialCommunityIcons
            name="inbox-outline"
            size={18}
            color={colors.primary}
          />
        </View>
        {Object.entries(ORDER_STATUS_LABEL ?? {}).map(([status, label]) => {
          const cfg = STATUS_CONFIG[status];
          const count = statusCount[status] || 0;
          return (
            <View key={status} style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: cfg?.color ?? "#64748B" },
                ]}
              />
              <Text style={styles.statusName}>{label}</Text>
              <View
                style={[
                  styles.statusCountBadge,
                  { backgroundColor: cfg?.bg ?? "#F8FAFC" },
                ]}
              >
                <Text
                  style={[
                    styles.statusCount,
                    { color: cfg?.color ?? "#64748B" },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const map = {
              "En attente": ORDER_STATUS.EN_ATTENTE,
              "En préparation": ORDER_STATUS.EN_PREPARATION,
              Prête: ORDER_STATUS.PRETE,
            };
            const count =
              tab === "Tout" ? orders.length : statusCount[map[tab]] || 0;
            return (
              <Pressable
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune commande dans cette catégorie</Text>
        }
        renderItem={({ item }) => {
          const cfg =
            STATUS_CONFIG[item.status] ??
            STATUS_CONFIG[ORDER_STATUS.EN_ATTENTE];
          return (
            <Pressable
              style={[styles.orderCard, { borderLeftColor: cfg.color }]}
              onPress={() => setSelectedOrder(item)}
            >
              <View style={styles.orderTop}>
                <Text style={styles.orderCode}>
                  ORDER #{item.id.slice(0, 4).toUpperCase()}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                  <View
                    style={[
                      styles.statusDotSmall,
                      { backgroundColor: cfg.color },
                    ]}
                  />
                  <Text style={[styles.statusPillText, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.customer}>
                {item.profiles
                  ? `${item.profiles.prenom ?? ""} ${item.profiles.nom ?? ""}`.trim()
                  : (item.user_id?.slice(0, 10) ?? "Client")}
              </Text>
              <Text style={styles.totalText}>{formatFcfa(item.total)}</Text>
              <Text style={styles.paymentMeta}>
                {item.payment_status === "paid"
                  ? "Paiement confirme"
                  : "Paiement en attente"}
              </Text>

              <View style={styles.itemsWrap}>
                {(item.order_items ?? []).slice(0, 2).map((row) => (
                  <Text key={row.id} style={styles.itemText}>
                    • {row.quantite}x {row.products?.nom ?? "Produit"}
                  </Text>
                ))}
                {(item.order_items ?? []).length > 2 && (
                  <Text style={styles.itemTextMore}>
                    +{item.order_items.length - 2} autres...
                  </Text>
                )}
              </View>

              <View style={styles.actionsWrap}>
                {item.status === ORDER_STATUS.EN_ATTENTE && (
                  <Pressable
                    style={styles.actionBtnPrimary}
                    onPress={() =>
                      changeStatus(item.id, ORDER_STATUS.EN_PREPARATION)
                    }
                  >
                    <Text style={styles.actionBtnPrimaryText}>
                      Accepter & Préparer
                    </Text>
                  </Pressable>
                )}
                {item.status === ORDER_STATUS.EN_PREPARATION && (
                  <Pressable
                    style={[
                      styles.actionBtnOutline,
                      { borderColor: "#F59E0B" },
                    ]}
                    onPress={() => changeStatus(item.id, ORDER_STATUS.PRETE)}
                  >
                    <Text
                      style={[
                        styles.actionBtnOutlineText,
                        { color: "#F59E0B" },
                      ]}
                    >
                      Marquer comme Prête
                    </Text>
                  </Pressable>
                )}
                {item.status === ORDER_STATUS.PRETE && (
                  <Pressable
                    style={[
                      styles.actionBtnOutline,
                      { borderColor: "#10B981" },
                    ]}
                    onPress={() => changeStatus(item.id, ORDER_STATUS.LIVREE)}
                  >
                    <Text
                      style={[
                        styles.actionBtnOutlineText,
                        { color: "#10B981" },
                      ]}
                    >
                      Notifier le client
                    </Text>
                  </Pressable>
                )}
                {item.payment_status !== "paid" && (
                  <Pressable
                    style={[
                      styles.actionBtnOutline,
                      { borderColor: "#2563EB" },
                    ]}
                    onPress={() => handleMarkPaid(item.id)}
                  >
                    <Text
                      style={[
                        styles.actionBtnOutlineText,
                        { color: "#2563EB" },
                      ]}
                    >
                      Marquer payee
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.detailBtn}
                  onPress={() => setSelectedOrder(item)}
                >
                  <Text style={styles.detailBtnText}>Détails</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={changeStatus}
        onMarkPaid={handleMarkPaid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F3" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 10,
    backgroundColor: "#F7F6F3",
  },
  centerTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
  },
  centerText: {
    color: "#94A3B8",
    textAlign: "center",
    fontFamily: "Manrope_500Medium",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(248,247,244,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(244,140,37,0.08)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  storeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { color: "#1e293b", fontFamily: "Manrope_700Bold", fontSize: 16 },
  branch: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginTop: 1,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF3F8",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiGrid: { flexDirection: "row", gap: 10, padding: 14, paddingBottom: 0 },
  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  kpiPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  kpiPrimaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  kpiPrimaryValue: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
  },
  kpiLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  kpiValue: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 28,
  },
  kpiBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  kpiBadgeText: { color: "white", fontFamily: "Manrope_700Bold", fontSize: 10 },
  statusCard: {
    margin: 14,
    marginBottom: 0,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusCardTitle: {
    color: "#64748B",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusName: {
    flex: 1,
    color: "#334155",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  statusCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusCount: { fontFamily: "Manrope_800ExtraBold", fontSize: 13 },
  tabsWrap: { paddingTop: 14, paddingLeft: 14 },
  tabsRow: { gap: 8, paddingRight: 14 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  tabTextActive: { color: "white", fontFamily: "Manrope_700Bold" },
  list: { padding: 14, gap: 10, paddingBottom: 30 },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    marginTop: 20,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCode: {
    color: "#94A3B8",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: "Manrope_700Bold", fontSize: 11 },
  customer: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
  totalText: {
    color: colors.primary,
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  paymentMeta: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  itemsWrap: {
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    gap: 3,
  },
  itemText: { color: "#64748B", fontFamily: "Manrope_500Medium", fontSize: 13 },
  itemTextMore: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    fontStyle: "italic",
  },
  actionsWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnPrimaryText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnOutlineText: { fontFamily: "Manrope_700Bold", fontSize: 13 },
  detailBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailBtnText: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#1e293b", fontFamily: "Manrope_800ExtraBold", fontSize: 18 },
  overviewCard: {
    backgroundColor: "#EFF6FF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  overviewSubtitle: {
    color: "#2563EB",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  overviewName: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 26,
  },
  idBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idBadgeText: {
    color: "#2563EB",
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
  overviewTimeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  overviewTime: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  content: { padding: 16, gap: 10, paddingBottom: 30 },
  sectionTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
    marginBottom: 8,
  },
  itemsList: { gap: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemQtyBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FFF2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  itemQty: {
    color: colors.primary,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
  },
  itemName: { color: "#1e293b", fontFamily: "Manrope_700Bold", fontSize: 17 },
  itemSub: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: 18,
    paddingBottom: 28,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  statusToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusToggleLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  statusToggleValue: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
  },
  actionBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  actionBtnText: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
});
