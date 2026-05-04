import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../hooks/useCart";
import colors from "../theme/colors";
import { formatFcfa } from "../utils/currency";

export default function ProductDetailScreen({ navigation, route }) {
  const { product } = route.params ?? {};
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [extraChicken, setExtraChicken] = useState(0);
  const [spicy, setSpicy] = useState(true);
  const [isFav, setIsFav] = useState(false);

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Produit introuvable</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, marginTop: 8 }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const extraPrice = extraChicken * 1000;
  const totalPrice = (product.prix + extraPrice) * qty;

  const handleAddToCart = () => {
    addItem(product, qty);
    Alert.alert("Panier", `${product.nom} ajouté au panier.`, [
      { text: "Voir le panier", onPress: () => navigation.navigate("Panier") },
      { text: "Continuer", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.floatingHeader}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#334155" />
        </Pressable>
        <Pressable style={styles.headerBtn} onPress={() => setIsFav(!isFav)}>
          <MaterialCommunityIcons
            name={isFav ? "heart" : "heart-outline"}
            size={24}
            color={isFav ? "#EF4444" : "#334155"}
          />
        </Pressable>
      </View>

      {/* Image */}
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="Logo Cantine Connectee"
            />
          </View>
        )}
        <View style={styles.imageGradient} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title & Price */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{product.nom}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <MaterialCommunityIcons key={s} name="star" size={14} color="#F59E0B" />
              ))}
              <Text style={styles.ratingText}>4.8 (120+ avis)</Text>
            </View>
          </View>
          <Text style={styles.price}>{formatFcfa(product.prix)}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description ?? "Un délicieux plat traditionnel, préparé avec des épices locales et des ingrédients frais. Servi chaud avec un goût authentique."}
          </Text>
        </View>

        {/* Extras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personnalisation</Text>

          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionLabel}>Supplément Poulet</Text>
              <Text style={styles.optionCaption}>+ {formatFcfa(1000)}</Text>
            </View>
            <View style={styles.qtyGroup}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setExtraChicken(Math.max(0, extraChicken - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qtyVal}>{extraChicken}</Text>
              <Pressable
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={() => setExtraChicken(extraChicken + 1)}
              >
                <Text style={[styles.qtyBtnText, { color: "white" }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.optionLabel}>Sauce Pimentée</Text>
              <Text style={[styles.optionCaption, { color: "#10B981" }]}>Gratuit</Text>
            </View>
            <Pressable
              style={[styles.toggle, spicy && styles.toggleOn]}
              onPress={() => setSpicy(!spicy)}
            >
              <View style={[styles.toggleThumb, spicy && styles.toggleThumbOn]} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.qtyMain}>
          <Pressable style={styles.qtyMainBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
            <Text style={styles.qtyMainText}>−</Text>
          </Pressable>
          <Text style={styles.qtyMainVal}>{qty}</Text>
          <Pressable style={styles.qtyMainBtn} onPress={() => setQty(qty + 1)}>
            <Text style={styles.qtyMainText}>+</Text>
          </Pressable>
        </View>
        <Pressable style={styles.addBtn} onPress={handleAddToCart}>
          <MaterialCommunityIcons name="cart-outline" size={20} color="white" />
          <Text style={styles.addBtnText}>Ajouter — {formatFcfa(totalPrice)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: "Manrope_600SemiBold", color: "#64748B" },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 20,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrap: { width: "100%", height: 320, backgroundColor: "#F1F5F9" },
  image: { width: "100%", height: "100%" },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(255,255,255,0)",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  name: { color: "#1e293b", fontFamily: "Manrope_800ExtraBold", fontSize: 24, lineHeight: 30, maxWidth: "70%" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 },
  ratingText: { color: "#64748B", fontFamily: "Manrope_600SemiBold", fontSize: 12, marginLeft: 4 },
  price: { color: "#059669", fontFamily: "Manrope_800ExtraBold", fontSize: 22 },
  section: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  sectionTitle: { color: "#1e293b", fontFamily: "Manrope_700Bold", fontSize: 16, marginBottom: 10 },
  description: { color: "#64748B", fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 22 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  optionLabel: { color: "#334155", fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  optionCaption: { color: "#94A3B8", fontFamily: "Manrope_500Medium", fontSize: 12, marginTop: 2 },
  qtyGroup: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F1F5F9", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "white", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  qtyBtnAdd: { backgroundColor: "#10B981" },
  qtyBtnText: { color: "#334155", fontFamily: "Manrope_700Bold", fontSize: 18 },
  qtyVal: { color: "#334155", fontFamily: "Manrope_700Bold", fontSize: 16, minWidth: 20, textAlign: "center" },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: "#10B981" },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  qtyMain: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  qtyMainBtn: { padding: 6 },
  qtyMainText: { color: "#64748B", fontFamily: "Manrope_700Bold", fontSize: 20 },
  qtyMainVal: { color: "#1e293b", fontFamily: "Manrope_800ExtraBold", fontSize: 18, minWidth: 24, textAlign: "center" },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  addBtnText: { color: "white", fontFamily: "Manrope_800ExtraBold", fontSize: 16 },
});
