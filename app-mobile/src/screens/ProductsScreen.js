import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ProductCard from "../components/ProductCard";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { getProducts } from "../services/productsService";
import { getVendors } from "../services/vendorService";
import { createSimpleOrder } from "../services/ordersService";
import { buildPaymentLink } from "../services/paymentsService";
import { supabase } from "../lib/supabase";
import colors from "../theme/colors";

const PICKUP_TIMES = ["12:00", "12:30", "13:00", "13:30"];

const PAYMENT_LOGOS = {
  wave: require("../../assets/wave-logo.png"),
  orange_money: require("../../assets/Orange-Money-logo.png"),
};

export default function ProductsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { addItem, cartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [category, setCategory] = useState("tous");
  const [selectedVendorId, setSelectedVendorId] = useState("tous");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [selectedTab, setSelectedTab] = useState("today");
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [selectedPayment, setSelectedPayment] = useState("wave");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [pendingProduct, setPendingProduct] = useState(null);

  const isSmall = width < 380;

  const loadProducts = async () => {
    try {
      setLoading(true);
      const vendorList = await getVendors();
      setVendors(vendorList);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      Alert.alert("Produits", error.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadProducts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "tous" || p.category === category) &&
          (selectedVendorId === "tous" || p.vendor_id === selectedVendorId),
      ),
    [products, category, selectedVendorId],
  );

  const vendorOptions = useMemo(
    () => [
      { id: "tous", nom_cantine: "Toutes cantines" },
      ...vendors,
    ],
    [vendors],
  );

  const handleOrder = async (product) => {
    if (!product?.id) {
      Alert.alert("Commande", "Produit invalide.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Commande", "Vous devez être connecté.");
      return;
    }
    if (selectedPayment !== "cash" && !paymentPhone.trim()) {
      Alert.alert("Paiement", "Veuillez saisir votre numéro de téléphone pour le paiement.");
      return;
    }
    if (ordering) return;
    try {
      setOrdering(true);
      const { id: orderId } = await createSimpleOrder({
        userId: user.id,
        product,
        modePaiement: selectedPayment,
      });
      if (selectedPayment !== "cash") {
        const paymentLink = buildPaymentLink(selectedPayment, {
          amount: product?.prix,
          phoneNumber: paymentPhone.trim(),
          reference: orderId ?? null,
        });

        if (paymentLink) {
          const supported = await Linking.canOpenURL(paymentLink);
          if (supported) {
            await Linking.openURL(paymentLink);
          }
        }

        navigation.navigate("Paiement", {
          orderIds: orderId ? [orderId] : [],
          modePaiement: selectedPayment,
          paymentLink,
          phoneNumber: paymentPhone.trim(),
          amount: product?.prix,
        });
        return;
      }

      Alert.alert("Commande", "Commande passée avec succès.", [
        {
          text: "Voir mes commandes",
          onPress: () => navigation.navigate("Commandes"),
        },
        { text: "OK", style: "cancel" },
      ]);
    } catch (error) {
      Alert.alert("Commande", error.message ?? "Erreur lors de la commande");
    } finally {
      setOrdering(false);
    }
  };

  const handlePayNow = async () => {
    if (!pendingProduct) {
      Alert.alert("Paiement", "Choisissez d'abord un plat (bouton Commander).");
      return;
    }

    await handleOrder(pendingProduct);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandBox}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Cantine Connectée</Text>
          <Text style={styles.headerSub}>Bienvenue</Text>
        </View>
        <Pressable
          style={styles.notifBtn}
          onPress={() => navigation.navigate("Panier")}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color="#334155"
          />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Tabs */}
        <View style={styles.tabWrap}>
          <Pressable
            style={[styles.tab, selectedTab === "today" && styles.tabActive]}
            onPress={() => setSelectedTab("today")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "today" && styles.tabTextActive,
              ]}
            >
              Menu du jour
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, selectedTab === "tomorrow" && styles.tabActive]}
            onPress={() => setSelectedTab("tomorrow")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "tomorrow" && styles.tabTextActive,
              ]}
            >
              Pré-commander demain
            </Text>
          </Pressable>
        </View>

        {/* Hero */}
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
          }}
          style={styles.hero}
          imageStyle={styles.heroImg}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Spécial du chef</Text>
            </View>
            <Text style={[styles.heroTitle, isSmall && { fontSize: 20 }]}>
              Menu Gourmet
            </Text>
            <View style={styles.heroFooter}>
              <Text style={styles.heroDesc}>Frais, sain et bio</Text>
              <Text style={styles.heroPrice}>6.50 €</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Section header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Options du jour</Text>
          <Pressable onPress={() => navigation.navigate("Panier")}>
            <Text style={styles.seeAll}>Panier ({cartCount})</Text>
          </Pressable>
        </View>

        {/* Categories */}
        <FlatList
          horizontal
          data={vendorOptions}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={styles.vendorList}
          contentContainerStyle={styles.catContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.vendorChip,
                selectedVendorId === item.id && styles.vendorChipActive,
              ]}
              onPress={() => setSelectedVendorId(item.id)}
            >
              <Text
                style={[
                  styles.vendorLabel,
                  selectedVendorId === item.id && styles.vendorLabelActive,
                ]}
                numberOfLines={1}
              >
                {item.nom_cantine}
              </Text>
            </Pressable>
          )}
        />

        {/* Categories */}
        <FlatList
          horizontal
          data={PRODUCT_CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={styles.catContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.catChip,
                category === item.id && styles.catChipActive,
              ]}
              onPress={() => setCategory(item.id)}
            >
              <Text
                style={[
                  styles.catLabel,
                  category === item.id && styles.catLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {ordering && (
          <View style={styles.loadingBar}>
            <View style={styles.loadingDot} />
            <Text style={styles.loadingText}>Création de commande...</Text>
          </View>
        )}

        {/* Products */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadProducts}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>Aucun produit disponible</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onOrder={(p) => {
                setPendingProduct(p);
                Alert.alert(
                  "Paiement",
                  `Plat sélectionné : ${p?.nom ?? ""}\nChoisissez le paiement puis cliquez sur Payer.`,
                );
              }}
              onAddToCart={(product) => {
                addItem(product, 1);
                Alert.alert("Panier", `${product.nom} ajouté au panier.`);
              }}
            />
          )}
        />

        {/* Pickup Time */}
        <View style={styles.pickupWrap}>
          <View style={styles.pickupHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.pickupTitle}>Créneau de récupération</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pickupRow}
          >
            {PICKUP_TIMES.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.timeChip,
                  selectedTime === t && styles.timeChipActive,
                ]}
                onPress={() => setSelectedTime(t)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === t && styles.timeTextActive,
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Mode de paiement</Text>
          <View style={styles.paymentGrid}>
            <Pressable
              style={[
                styles.paymentCard,
                selectedPayment === "wave" && styles.paymentCardActive,
              ]}
              onPress={() => setSelectedPayment("wave")}
            >
              {selectedPayment === "wave" ? (
                <View style={styles.paymentCheck}>
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color="white"
                  />
                </View>
              ) : null}
              <Image source={PAYMENT_LOGOS.wave} style={styles.paymentLogo} resizeMode="contain" />
              <Text style={styles.paymentLabel}>Wave</Text>
            </Pressable>
            <Pressable
              style={[
                styles.paymentCard,
                selectedPayment === "orange_money" && styles.paymentCardActive,
              ]}
              onPress={() => setSelectedPayment("orange_money")}
            >
              {selectedPayment === "orange_money" ? (
                <View style={styles.paymentCheck}>
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color="white"
                  />
                </View>
              ) : null}
              <Image source={PAYMENT_LOGOS.orange_money} style={styles.paymentLogo} resizeMode="contain" />
              <Text style={styles.paymentLabel}>Orange Money</Text>
            </Pressable>
            <Pressable
              style={[
                styles.paymentCard,
                selectedPayment === "cash" && styles.paymentCardActive,
              ]}
              onPress={() => setSelectedPayment("cash")}
            >
              {selectedPayment === "cash" ? (
                <View style={styles.paymentCheck}>
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color="white"
                  />
                </View>
              ) : null}
              <Text style={styles.paymentLabel}>Espèces</Text>
            </Pressable>
          </View>

          {selectedPayment !== "cash" ? (
            <View style={styles.phoneWrap}>
              <Text style={styles.phoneLabel}>Numéro de téléphone</Text>
              <TextInput
                value={paymentPhone}
                onChangeText={setPaymentPhone}
                placeholder="Ex: 77 000 00 00"
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
          ) : null}

          <View style={styles.payWrap}>
            <Text style={styles.payHint} numberOfLines={2}>
              {pendingProduct
                ? `Plat: ${pendingProduct.nom} (${pendingProduct.prix})`
                : "Sélectionnez un plat (bouton Commander) pour activer Payer"}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.payBtn,
                (!pendingProduct || ordering) && styles.payBtnDisabled,
                pressed && pendingProduct && !ordering && { opacity: 0.9 },
              ]}
              disabled={!pendingProduct || ordering}
              onPress={handlePayNow}
            >
              <MaterialCommunityIcons name="credit-card-outline" size={18} color="white" />
              <Text style={styles.payBtnText}>{ordering ? "Paiement..." : "Payer"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Order Button */}
        <Pressable
          style={({ pressed }) => [
            styles.orderBtn,
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => navigation.navigate("Panier")}
        >
          <Text style={styles.orderBtnText}>Voir le panier</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f7f5" },
  scroll: { paddingBottom: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(244,140,37,0.1)",
  },
  brandBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(244,140,37,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  headerSub: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginTop: 1,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontFamily: "Manrope_700Bold", fontSize: 9 },
  tabWrap: {
    flexDirection: "row",
    margin: 14,
    backgroundColor: "rgba(244,140,37,0.06)",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  tabTextActive: { color: "white", fontFamily: "Manrope_700Bold" },
  hero: {
    height: 180,
    marginHorizontal: 14,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroImg: { borderRadius: 18 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroContent: { padding: 14, zIndex: 2 },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
  },
  heroTitle: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 24,
    lineHeight: 28,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  heroDesc: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  heroPrice: {
    color: "#FCD34D",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
  },
  seeAll: {
    color: colors.primary,
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  vendorList: { paddingHorizontal: 10, maxHeight: 42, marginBottom: 8 },
  catList: { paddingHorizontal: 10, maxHeight: 44, marginBottom: 10 },
  catContent: { paddingHorizontal: 4, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(244,140,37,0.2)",
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vendorChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxWidth: 180,
  },
  vendorChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  vendorLabel: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  vendorLabelActive: { color: "white", fontFamily: "Manrope_700Bold" },
  catLabel: {
    color: "#64748B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  catLabelActive: { color: "white", fontFamily: "Manrope_700Bold" },
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,78,137,0.07)",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#0369A1",
  },
  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#0369A1",
  },
  loadingText: {
    color: "#0369A1",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  list: { gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    marginTop: 20,
  },
  pickupWrap: {
    marginHorizontal: 14,
    marginTop: 16,
    padding: 14,
    backgroundColor: "rgba(244,140,37,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(244,140,37,0.1)",
  },
  pickupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  pickupTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  pickupRow: { gap: 8, paddingBottom: 4 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "rgba(244,140,37,0.25)",
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: { color: "#64748B", fontFamily: "Manrope_700Bold", fontSize: 13 },
  timeTextActive: { color: "white" },
  paymentSection: { marginHorizontal: 14, marginTop: 16 },
  paymentTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    marginBottom: 10,
  },
  paymentGrid: { flexDirection: "row", gap: 10 },
  paymentCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentCardActive: { borderColor: colors.primary },
  paymentCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    marginTop: 4,
  },
  paymentLogo: { width: 64, height: 26 },
  phoneWrap: { marginTop: 12, gap: 8 },
  phoneLabel: { color: "#94A3B8", fontFamily: "Manrope_700Bold", fontSize: 12 },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "white",
    color: "#1e293b",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  payWrap: {
    marginTop: 12,
    gap: 10,
  },
  payHint: {
    color: "#64748B",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: "white", fontFamily: "Manrope_800ExtraBold", fontSize: 16 },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 14,
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orderBtnText: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
});
