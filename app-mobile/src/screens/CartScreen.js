import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { PAYMENT_MODES } from "../constants/orders";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { checkoutCart } from "../services/ordersService";
import { buildPaymentLink } from "../services/paymentsService";
import { supabase } from "../lib/supabase";
import colors from "../theme/colors";
import { formatFcfa } from "../utils/currency";

const SLOTS = [
  { id: "12:00", label: "Indisponible", disabled: true },
  { id: "12:15", label: "Disponible", disabled: false },
  { id: "12:30", label: "Complet", disabled: true },
];

const PAYMENT_OPTIONS = [
  {
    id: "wave",
    label: "Wave",
    caption: "Paiement instantané",
    color: "#2563EB",
  },
  {
    id: "orange_money",
    label: "Orange Money",
    caption: "Paiement sécurisé",
    color: "#EA580C",
  },
  {
    id: "cash",
    label: "Espèces",
    caption: "Paiement en caisse",
    color: "#059669",
  },
];

const PAYMENT_LOGOS = {
  wave: require("../../assets/wave-logo.png"),
  orange_money: require("../../assets/Orange-Money-logo.png"),
};

function CartItemRow({ item, onInc, onDec, onRemove }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemImgWrap}>
        {item.product.image_url ? (
          <Image
            source={{ uri: item.product.image_url }}
            style={styles.itemImg}
          />
        ) : (
          <View style={styles.itemImgFallback}>
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="Logo Cantine Connectee"
            />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.product.nom}
        </Text>
        <Text style={styles.itemQty}>Quantité : {item.quantity}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>
          {formatFcfa(item.product.prix * item.quantity)}
        </Text>
        <View style={styles.itemControls}>
          <Pressable style={styles.ctrlBtn} onPress={onDec}>
            <Text style={styles.ctrlBtnText}>−</Text>
          </Pressable>
          <Pressable style={styles.ctrlBtn} onPress={onInc}>
            <Text style={styles.ctrlBtnText}>+</Text>
          </Pressable>
          <Pressable
            style={[styles.ctrlBtn, styles.ctrlBtnDanger]}
            onPress={onRemove}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={14}
              color="#EF4444"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const {
    items,
    groupedByVendor,
    subtotal,
    clearCart,
    removeItem,
    setItemQuantity,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [modePaiement, setModePaiement] = useState("wave");
  const [selectedSlot, setSelectedSlot] = useState("12:15");
  const [paymentPhone, setPaymentPhone] = useState("");

  const canCheckout = useMemo(
    () => items.length > 0 && !loading,
    [items.length, loading],
  );

  const handleCheckout = async () => {
    if (!user?.id) {
      Alert.alert("Panier", "Vous devez être connecté.");
      return;
    }
    if (groupedByVendor.length === 0) {
      Alert.alert("Panier", "Votre panier est vide.");
      return;
    }
    if (modePaiement !== "cash" && !paymentPhone.trim()) {
      Alert.alert(
        "Paiement",
        "Veuillez saisir votre numéro de téléphone pour le paiement.",
      );
      return;
    }

    setLoading(true);
    try {
      const orderIds = await checkoutCart({ groupedByVendor, modePaiement });
      clearCart();
      if (modePaiement !== "cash") {
        const totalAmount = Number(subtotal) || 0;
        const paymentLink = buildPaymentLink(modePaiement, {
          amount: totalAmount,
          phoneNumber: paymentPhone.trim(),
          reference:
            Array.isArray(orderIds) && orderIds.length > 0
              ? orderIds.join(",")
              : null,
        });

        if (paymentLink) {
          try {
            await Linking.openURL(paymentLink);
          } catch (error) {
            // If auto-open fails, user can open it from the next screen.
          }
        }

        navigation.navigate("Paiement", {
          orderIds,
          modePaiement,
          paymentLink,
          phoneNumber: paymentPhone.trim(),
          amount: totalAmount,
        });
        return;
      }

      Alert.alert(
        "Commande confirmée !",
        `${orderIds.length} commande(s) créée(s) avec succès.`,
        [
          {
            text: "Voir mes commandes",
            onPress: () => navigation.navigate("Commandes"),
          },
          { text: "OK", style: "cancel" },
        ],
      );
    } catch (error) {
      const errorMessage = error.message ?? "Erreur de validation";
      console.error("[CartScreen] Erreur checkout:", errorMessage);

      // Afficher plus de détails selon le type d'erreur
      if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        Alert.alert(
          "❌ Erreur de paiement",
          "Le serveur a rejeté votre demande. Vérifiez que vous êtes connecté et essayez à nouveau.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert("❌ Commande", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons
            name="cart-outline"
            size={52}
            color={colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>Panier vide</Text>
        <Text style={styles.emptyText}>
          Ajoutez des produits avant de commander.
        </Text>
        <Pressable
          style={styles.emptyBtn}
          onPress={() => navigation.navigate("Produits")}
        >
          <Text style={styles.emptyBtnText}>Voir le menu</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color="#334155"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Finaliser la commande</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cart Items */}
        <Text style={styles.sectionLabel}>VOTRE PANIER</Text>
        <View style={styles.card}>
          {items.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              onInc={() => setItemQuantity(item.product.id, item.quantity + 1)}
              onDec={() => setItemQuantity(item.product.id, item.quantity - 1)}
              onRemove={() => removeItem(item.product.id)}
            />
          ))}
        </View>

        {/* Time Slot */}
        <Text style={styles.sectionLabel}>CRÉNEAU DE RÉCUPÉRATION</Text>
        <View style={styles.slotRow}>
          {SLOTS.map((slot) => (
            <Pressable
              key={slot.id}
              disabled={slot.disabled && slot.id !== selectedSlot}
              style={[
                styles.slotCard,
                selectedSlot === slot.id && styles.slotActive,
                slot.disabled &&
                  selectedSlot !== slot.id &&
                  styles.slotDisabled,
              ]}
              onPress={() => !slot.disabled && setSelectedSlot(slot.id)}
            >
              <Text
                style={[
                  styles.slotTime,
                  selectedSlot === slot.id && styles.slotTimeActive,
                ]}
              >
                {slot.id}
              </Text>
              <Text
                style={[
                  styles.slotLabel,
                  selectedSlot === slot.id && { color: "#059669" },
                ]}
              >
                {slot.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Payment */}
        <Text style={styles.sectionLabel}>MODE DE PAIEMENT</Text>
        <View style={styles.paymentWrap}>
          {PAYMENT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[
                styles.paymentCard,
                modePaiement === opt.id && {
                  borderColor: opt.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setModePaiement(opt.id)}
            >
              <View
                style={[
                  styles.paymentIconWrap,
                  { backgroundColor: opt.color + "18" },
                ]}
              >
                {PAYMENT_LOGOS[opt.id] ? (
                  <Image
                    source={PAYMENT_LOGOS[opt.id]}
                    style={styles.paymentLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[styles.paymentIconText, { color: opt.color }]}>
                    {opt.id === "wave"
                      ? "W"
                      : opt.id === "orange_money"
                        ? "OM"
                        : "€"}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>{opt.label}</Text>
                <Text style={styles.paymentCaption}>{opt.caption}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  modePaiement === opt.id && {
                    backgroundColor: opt.color,
                    borderColor: opt.color,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {modePaiement !== "cash" ? (
          <View style={styles.phoneWrap}>
            <Text style={styles.phoneLabel}>NUMÉRO DE TÉLÉPHONE</Text>
            <TextInput
              value={paymentPhone}
              onChangeText={setPaymentPhone}
              placeholder="Ex: 77 000 00 00"
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalAmount}>{formatFcfa(subtotal)}</Text>
          </View>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{selectedSlot} – 12:30</Text>
          </View>
        </View>
        <Pressable
          disabled={!canCheckout}
          style={[styles.confirmBtn, !canCheckout && styles.confirmBtnDisabled]}
          onPress={handleCheckout}
        >
          <Text style={styles.confirmText}>
            {loading ? "Validation..." : "Confirmer la commande"}
          </Text>
          <MaterialCommunityIcons
            name="lock-outline"
            size={16}
            color="rgba(255,255,255,0.8)"
          />
        </Pressable>
        <Text style={styles.secureNote}>
          PAIEMENT 100% SÉCURISÉ PAR CANTINE CONNECTÉE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7F4" },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#F8F7F4",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(244,140,37,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 22,
    marginBottom: 6,
  },
  emptyText: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  emptyBtnText: { color: "white", fontFamily: "Manrope_700Bold", fontSize: 15 },
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
  },
  scrollContent: { padding: 16, paddingBottom: 220, gap: 12 },
  sectionLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 8,
    marginBottom: 6,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  itemImgWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  itemImg: { width: "100%", height: "100%" },
  itemImgFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  itemName: { color: "#1e293b", fontFamily: "Manrope_700Bold", fontSize: 15 },
  itemQty: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  itemRight: { alignItems: "flex-end", gap: 6 },
  itemPrice: {
    color: "#059669",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 15,
  },
  itemControls: { flexDirection: "row", gap: 6 },
  ctrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnDanger: { backgroundColor: "#FEF2F2" },
  ctrlBtnText: {
    color: "#334155",
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
  },
  slotRow: { flexDirection: "row", gap: 10 },
  slotCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "white",
    paddingVertical: 14,
    alignItems: "center",
  },
  slotActive: { borderColor: "#059669", backgroundColor: "#F0FDF4" },
  slotDisabled: { opacity: 0.4 },
  slotTime: { color: "#334155", fontFamily: "Manrope_700Bold", fontSize: 16 },
  slotTimeActive: { color: "#059669" },
  slotLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    marginTop: 3,
  },
  paymentWrap: { gap: 10 },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  paymentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLogo: { width: 38, height: 38 },
  paymentIconText: { fontFamily: "Manrope_800ExtraBold", fontSize: 16 },
  paymentLabel: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  paymentCaption: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "transparent",
  },
  phoneWrap: { marginTop: 12, gap: 8 },
  phoneLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
  },
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px -4px 12px rgba(0,0,0,0.06)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        }),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  totalAmount: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 30,
  },
  slotBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },
  slotBadgeText: {
    color: "#059669",
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 18,
    paddingVertical: 17,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 6px 12px rgba(5,150,105,0.3)" }
      : {
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }),
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    ...(Platform.OS === "web" ? { boxShadow: "none" } : { shadowOpacity: 0 }),
  },
  confirmText: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
  secureNote: {
    textAlign: "center",
    color: "#CBD5E1",
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 10,
  },
});
