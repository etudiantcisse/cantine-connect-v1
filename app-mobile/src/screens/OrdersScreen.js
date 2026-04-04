import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import OrderCard from "../components/OrderCard";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { cancelOrder, getOrdersByUser } from "../services/ordersService";
import colors from "../theme/colors";

const STATUS_TABS = ["Toutes", "En cours", "Prêtes", "Livrées"];

export default function OrdersScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Toutes");
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");

  const loadOrders = async () => {
    if (!user?.id) { setOrders([]); setLoading(false); return; }
    try {
      setLoading(true);
      const data = await getOrdersByUser(user.id);
      setOrders(data);
    } catch (error) {
      Alert.alert("Commandes", error.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadOrders(); }, [user?.id]));

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`orders-realtime-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => {
        setRealtimeStatus("updated");
        loadOrders();
        setTimeout(() => setRealtimeStatus("connected"), 3000);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
      });
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleCancel = async (orderId) => {
    try {
      await cancelOrder(orderId);
      await loadOrders();
      Alert.alert("Commande", "Commande annulée.");
    } catch (error) {
      Alert.alert("Commande", error.message ?? "Erreur d'annulation");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "Toutes") return true;
    const map = { "En cours": ["en_attente", "en_preparation"], "Prêtes": ["prete"], "Livrées": ["livree"] };
    return (map[activeTab] ?? []).includes(o.status);
  });

  const rtConfig = {
    connecting: { color: "#F59E0B", bg: "#FFFBEB", text: "Connexion...", icon: "wifi-off" },
    connected: { color: "#10B981", bg: "#F0FDF4", text: "Temps réel actif", icon: "wifi" },
    updated: { color: colors.primary, bg: "#FFF7ED", text: "Commande mise à jour !", icon: "bell" },
  };
  const rt = rtConfig[realtimeStatus] ?? rtConfig.connected;

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Mes Commandes</Text>
            <Text style={styles.pageSubtitle}>Suivi et historique</Text>
          </View>
          <Pressable style={styles.cartBtn} onPress={() => navigation.navigate("Panier")}>
            <MaterialCommunityIcons name="cart-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
        <View style={[styles.liveRow, { backgroundColor: rt.bg }]}>
          <MaterialCommunityIcons name={rt.icon} size={14} color={rt.color} />
          <Text style={[styles.liveText, { color: rt.color }]}>{rt.text}</Text>
        </View>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item }) => {
            const isActive = activeTab === item;
            return (
              <Pressable
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(item)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Orders */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, width >= 900 && styles.listWide]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons name="receipt-text-outline" size={44} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptyText}>Vos commandes apparaîtront ici.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate("Produits")}>
                <Text style={styles.emptyBtnText}>Commander maintenant</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onCancel={handleCancel} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F3" },
  headerCard: {
    marginTop: 10,
    marginHorizontal: 14,
    marginBottom: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  pageTitle: { color: "#1e293b", fontFamily: "Manrope_800ExtraBold", fontSize: 24 },
  pageSubtitle: { color: "#94A3B8", fontFamily: "Manrope_500Medium", fontSize: 13, marginTop: 2 },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(244,140,37,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  liveText: { fontFamily: "Manrope_600SemiBold", fontSize: 12 },
  tabsWrap: { paddingHorizontal: 14, marginBottom: 4 },
  tabsRow: { gap: 8, paddingVertical: 4 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: "#64748B", fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  tabTextActive: { color: "white", fontFamily: "Manrope_700Bold" },
  list: { paddingHorizontal: 14, paddingBottom: 20, gap: 10 },
  listWide: { maxWidth: 920, width: "100%", alignSelf: "center" },
  emptyWrap: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(244,140,37,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { color: "#1e293b", fontFamily: "Manrope_800ExtraBold", fontSize: 20 },
  emptyText: { color: "#94A3B8", fontFamily: "Manrope_500Medium", textAlign: "center" },
  emptyBtn: { marginTop: 8, backgroundColor: colors.primary, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14 },
  emptyBtnText: { color: "white", fontFamily: "Manrope_700Bold", fontSize: 14 },
});
