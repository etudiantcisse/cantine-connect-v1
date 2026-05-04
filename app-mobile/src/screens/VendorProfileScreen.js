import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import {
  createVendorIfMissing,
  getVendorByProfile,
  updateVendor,
} from "../services/vendorService";
import colors from "../theme/colors";

const defaultForm = {
  nomCantine: "",
  localisation: "",
  telephone: "",
};

export default function VendorProfileScreen({ navigation }) {
  const { user, profile } = useAuth();
  const isVendor = profile?.role === "vendeur";
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user?.id || !isVendor) {
      setLoading(false);
      return;
    }

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
      setForm({
        nomCantine: v.nom_cantine ?? "",
        localisation: v.localisation ?? "",
        telephone: v.telephone ?? "",
      });
    } catch (error) {
      Alert.alert("Cantine", error.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, isVendor]);

  const save = async () => {
    if (!vendor?.id) {
      return;
    }

    if (!form.nomCantine.trim() || !form.localisation.trim()) {
      Alert.alert("Cantine", "Nom et localisation sont requis.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateVendor({
        vendorId: vendor.id,
        nomCantine: form.nomCantine.trim(),
        localisation: form.localisation.trim(),
        telephone: form.telephone.trim() || null,
      });
      setVendor(updated);
      Alert.alert("Cantine", "Informations mises à jour.");
    } catch (error) {
      Alert.alert("Cantine", error.message ?? "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (!isVendor) {
    return (
      <View style={styles.guardContainer}>
        <Text style={styles.guardTitle}>Accès vendeur requis</Text>
        <Text style={styles.guardText}>
          Cette section est réservée aux vendeurs pour gérer leur cantine.
        </Text>
        <Pressable
          style={styles.guardButton}
          onPress={() => navigation.navigate("Accueil")}
        >
          <Text style={styles.guardButtonText}>Retour à l'accueil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Ma cantine</Text>
            <Text style={styles.headerSubtitle}>Gérez vos informations</Text>
          </View>
        </View>
        <Pressable style={styles.refreshBtn} onPress={load}>
          <MaterialCommunityIcons name="refresh" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations de la cantine</Text>

            <Text style={styles.label}>Nom de la cantine</Text>
            <TextInput
              style={styles.input}
              placeholder="Cantine du Campus"
              placeholderTextColor={colors.mutedText}
              value={form.nomCantine}
              onChangeText={(v) => setForm((p) => ({ ...p, nomCantine: v }))}
            />

            <Text style={styles.label}>Localisation</Text>
            <TextInput
              style={styles.input}
              placeholder="Campus UCAD"
              placeholderTextColor={colors.mutedText}
              value={form.localisation}
              onChangeText={(v) => setForm((p) => ({ ...p, localisation: v }))}
            />

            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+221 XX XXX XXXX"
              placeholderTextColor={colors.mutedText}
              keyboardType="phone-pad"
              value={form.telephone}
              onChangeText={(v) => setForm((p) => ({ ...p, telephone: v }))}
            />

            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={save}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </Text>
            </Pressable>
          </View>
        )}
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
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF3F8",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 14 },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  loadingText: {
    color: colors.mutedText,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  sectionTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
    marginBottom: 4,
  },
  label: {
    color: colors.text,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
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
  saveBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  guardContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  guardTitle: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
    textAlign: "center",
  },
  guardText: {
    color: "#64748B",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
  },
  guardButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  guardButtonText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
});
