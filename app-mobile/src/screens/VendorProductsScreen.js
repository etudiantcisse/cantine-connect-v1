import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { useAuth } from "../hooks/useAuth";
import {
  createVendorIfMissing,
  createVendorProduct,
  deleteVendorProduct,
  getVendorByProfile,
  getVendorProducts,
  updateVendorProduct,
  updateVendorProductAvailability,
} from "../services/vendorService";
import colors from "../theme/colors";
import { formatFcfa } from "../utils/currency";

const defaultForm = { nom: "", description: "", prix: "", category: "plat" };

export default function VendorProductsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user, profile } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const categories = useMemo(
    () => PRODUCT_CATEGORIES.filter((c) => c.id !== "tous"),
    [],
  );

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let v = await getVendorByProfile(user.id);
      if (!v) {
        v = await createVendorIfMissing({
          profileId: user.id,
          nomCantine: `Cantine ${profile?.prenom ?? "Vendeur"}`,
          localisation: "Campus",
          telephone: profile?.telephone ?? "",
        });
      }
      setVendor(v);
      const list = await getVendorProducts(v.id);
      setProducts(list);
    } catch (error) {
      Alert.alert("Dashboard", error.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const saveProduct = async () => {
    const prix = Number(form.prix);
    if (
      !vendor?.id ||
      !form.nom.trim() ||
      !form.description.trim() ||
      prix <= 0
    ) {
      Alert.alert("Produit", "Veuillez remplir correctement le formulaire.");
      return;
    }
    setSaving(true);
    try {
      if (editingProductId) {
        await updateVendorProduct({
          productId: editingProductId,
          nom: form.nom.trim(),
          description: form.description.trim(),
          prix,
          category: form.category,
        });
      } else {
        await createVendorProduct({
          vendorId: vendor.id,
          nom: form.nom.trim(),
          description: form.description.trim(),
          prix,
          category: form.category,
        });
      }
      setForm(defaultForm);
      setEditingProductId(null);
      setShowForm(false);
      await load();
    } catch (error) {
      Alert.alert("Produit", error.message ?? "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await updateVendorProductAvailability(product.id, !product.is_available);
      await load();
    } catch (error) {
      Alert.alert("Produit", error.message ?? "Erreur de mise à jour");
    }
  };

  const startEdit = (product) => {
    setEditingProductId(product.id);
    setForm({
      nom: product.nom ?? "",
      description: product.description ?? "",
      prix: String(product.prix ?? ""),
      category: product.category ?? "plat",
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setForm(defaultForm);
    setShowForm(false);
  };

  const removeProduct = (product) => {
    Alert.alert("Supprimer", `Supprimer "${product.nom}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVendorProduct(product.id);
            if (editingProductId === product.id) cancelEdit();
            await load();
          } catch (error) {
            Alert.alert("Produit", error.message ?? "Erreur de suppression");
          }
        },
      },
    ]);
  };

  // Stock levels for display
  const stockData = useMemo(() => {
    const avail = products.filter((p) => p.is_available);
    const unavail = products.filter((p) => !p.is_available);
    return [
      {
        label: "Produits disponibles",
        count: avail.length,
        total: Math.max(products.length, 1),
        color: colors.primary,
      },
      {
        label: "Indisponibles",
        count: unavail.length,
        total: Math.max(products.length, 1),
        color: "#EF4444",
      },
    ];
  }, [products]);

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
            <Text style={styles.branch}>
              {vendor?.nom_cantine ?? "Main Station"}
            </Text>
          </View>
        </View>
        <Pressable style={styles.notifBtn} onPress={load}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color="#334155"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.kpiPrimary]}>
            <View style={styles.kpiTopRow}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={22}
                color="rgba(255,255,255,0.8)"
              />
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>+12%</Text>
              </View>
            </View>
            <Text style={styles.kpiLabel}>CHIFFRE D'AFFAIRES</Text>
            <Text style={styles.kpiPrimaryValue}>--</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={22}
                color={colors.primary}
              />
              <View
                style={[
                  styles.kpiBadge,
                  { backgroundColor: "rgba(244,140,37,0.12)" },
                ]}
              >
                <Text style={[styles.kpiBadgeText, { color: colors.primary }]}>
                  actifs
                </Text>
              </View>
            </View>
            <Text style={[styles.kpiLabel, { color: "#94A3B8" }]}>
              PRODUITS
            </Text>
            <Text style={styles.kpiValue}>{products.length}</Text>
          </View>
        </View>

        {/* Stock Status */}
        <View style={styles.stockCard}>
          <View style={styles.stockCardHeader}>
            <Text style={styles.stockTitle}>ÉTAT DU STOCK</Text>
            <MaterialCommunityIcons
              name="inbox-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          {stockData.map((item) => (
            <View key={item.label} style={styles.stockRow}>
              <View style={styles.stockRowHead}>
                <Text style={styles.stockLabel}>{item.label}</Text>
                <Text style={[styles.stockCount, { color: item.color }]}>
                  {item.count}
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(item.count / item.total) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Add / Edit Form Toggle */}
        <Pressable
          style={styles.addToggleBtn}
          onPress={() => {
            if (showForm && !editingProductId) setShowForm(false);
            else setShowForm(true);
          }}
        >
          <MaterialCommunityIcons
            name={showForm && !editingProductId ? "minus" : "plus"}
            size={20}
            color={colors.primary}
          />
          <Text style={styles.addToggleBtnText}>
            {showForm
              ? editingProductId
                ? "Modifier le produit"
                : "Masquer le formulaire"
              : "Ajouter un produit"}
          </Text>
        </Pressable>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingProductId ? "✏️ Modifier le produit" : "Nouveau produit"}
            </Text>
            <TextInput
              placeholder="Nom du produit *"
              style={styles.input}
              value={form.nom}
              onChangeText={(v) => setForm((p) => ({ ...p, nom: v }))}
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              placeholder="Description *"
              style={[styles.input, styles.inputMultiline]}
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
            />
            <TextInput
              placeholder="Prix en FCFA *"
              style={styles.input}
              keyboardType="numeric"
              value={form.prix}
              onChangeText={(v) => setForm((p) => ({ ...p, prix: v }))}
              placeholderTextColor="#94A3B8"
            />
            <View style={styles.catGrid}>
              {categories.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.catChip,
                    form.category === item.id && styles.catChipActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, category: item.id }))}
                >
                  <Text
                    style={[
                      styles.catText,
                      form.category === item.id && styles.catTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formActions}>
              <Pressable
                disabled={saving}
                style={styles.saveBtn}
                onPress={saveProduct}
              >
                <Text style={styles.saveBtnText}>
                  {saving
                    ? "Sauvegarde..."
                    : editingProductId
                      ? "Mettre à jour"
                      : "Ajouter"}
                </Text>
              </Pressable>
              {editingProductId && (
                <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Menu Availability */}
        <Text style={styles.sectionTitle}>Disponibilité du menu</Text>
        <View style={styles.productList}>
          {products.map((item) => (
            <View key={item.id} style={styles.productRow}>
              <View
                style={[
                  styles.productThumb,
                  { opacity: item.is_available ? 1 : 0.4 },
                ]}
              >
                <MaterialCommunityIcons
                  name="food"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.productName,
                    !item.is_available && styles.productNameOff,
                  ]}
                >
                  {item.nom}
                </Text>
                <Text style={styles.productMeta}>
                  {item.category} • {formatFcfa(item.prix)}
                </Text>
              </View>
              <View style={styles.productActions}>
                <Switch
                  value={item.is_available}
                  onValueChange={() => toggleAvailability(item)}
                  trackColor={{
                    false: "#E2E8F0",
                    true: "rgba(244,140,37,0.3)",
                  }}
                  thumbColor={item.is_available ? colors.primary : "#CBD5E1"}
                />
              </View>
            </View>
          ))}
          {products.length > 0 && (
            <View>
              {products.map((item) => (
                <View
                  key={`actions-${item.id}`}
                  style={styles.productActionsRow}
                >
                  <Text style={styles.productActionsLabel} numberOfLines={1}>
                    {item.nom}
                  </Text>
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => startEdit(item)}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={14}
                      color="#2563EB"
                    />
                    <Text style={styles.editBtnText}>Modifier</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => removeProduct(item)}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={14}
                      color="#EF4444"
                    />
                    <Text style={styles.deleteBtnText}>Supprimer</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          {products.length === 0 && !loading && (
            <Text style={styles.empty}>
              Aucun produit. Ajoutez votre premier produit ci-dessus.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(248,247,244,0.95)",
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
  scrollContent: { padding: 14, gap: 12, paddingBottom: 90 },
  kpiGrid: { flexDirection: "row", gap: 10 },
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
  kpiTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  kpiBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  kpiBadgeText: { color: "white", fontFamily: "Manrope_700Bold", fontSize: 10 },
  kpiLabel: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.6,
  },
  kpiPrimaryValue: {
    color: "white",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 22,
  },
  kpiValue: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 28,
  },
  stockCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  stockCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockTitle: {
    color: "#64748B",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  stockRow: { gap: 6 },
  stockRowHead: { flexDirection: "row", justifyContent: "space-between" },
  stockLabel: {
    color: "#334155",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  stockCount: { fontFamily: "Manrope_700Bold", fontSize: 13 },
  progressBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  addToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(244,140,37,0.3)",
    borderStyle: "dashed",
  },
  addToggleBtnText: {
    color: colors.primary,
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  formTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    color: "#1e293b",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  catChipActive: { borderColor: colors.primary, backgroundColor: "#FFF7ED" },
  catText: {
    color: "#334155",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  catTextActive: { color: colors.primary, fontFamily: "Manrope_700Bold" },
  formActions: { flexDirection: "row", gap: 8 },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: { color: "white", fontFamily: "Manrope_700Bold", fontSize: 15 },
  cancelBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#94A3B8",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  sectionTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
  },
  productList: { gap: 8 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  productNameOff: { color: "#94A3B8" },
  productMeta: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 1,
  },
  productActions: { alignItems: "center" },
  productActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  productActionsLabel: {
    flex: 1,
    color: "#64748B",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  editBtnText: {
    color: "#2563EB",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  deleteBtnText: {
    color: "#EF4444",
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
  },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    paddingVertical: 20,
  },
});
