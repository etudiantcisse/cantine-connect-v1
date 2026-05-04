import React, { useEffect, useRef } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../theme/colors";

export default function PaymentPendingScreen({ navigation, route }) {
  const {
    orderIds = [],
    modePaiement,
    paymentLink,
    phoneNumber,
    amount,
  } = route.params ?? {};
  const count = Array.isArray(orderIds) ? orderIds.length : 0;
  const autoOpenRef = useRef(false);

  const paymentLogos = {
    wave: require("../../assets/wave-logo.png"),
    orange_money: require("../../assets/Orange-Money-logo.png"),
  };

  const openPaymentLink = async () => {
    if (!paymentLink) {
      Alert.alert("Paiement", "Lien de paiement indisponible pour ce mode.");
      return;
    }

    try {
      await Linking.openURL(paymentLink);
    } catch (error) {
      Alert.alert(
        "Paiement",
        error?.message ?? "Impossible d'ouvrir le lien de paiement.",
      );
    }
  };

  useEffect(() => {
    if (!paymentLink || autoOpenRef.current) {
      return;
    }

    autoOpenRef.current = true;
    openPaymentLink();
  }, [paymentLink]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color="#334155"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Paiement en cours</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={30}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>Finaliser votre paiement</Text>
          <Text style={styles.subtitle}>
            {count > 0
              ? `${count} commande(s) en attente de paiement.`
              : "Votre commande est en attente de paiement."}
          </Text>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Mode: {modePaiement ?? "-"}</Text>
            </View>
            {paymentLink ? (
              <View style={[styles.badge, styles.badgeAccent]}>
                <Text style={[styles.badgeText, styles.badgeTextAccent]}>
                  Lien actif
                </Text>
              </View>
            ) : null}
          </View>

          {paymentLogos[modePaiement] ? (
            <View style={styles.logoRow}>
              <Image
                source={paymentLogos[modePaiement]}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {phoneNumber ? (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneLabel}>Numéro: </Text>
              <Text style={styles.phoneValue}>{phoneNumber}</Text>
            </View>
          ) : null}

          {typeof amount !== "undefined" && amount !== null ? (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneLabel}>Montant: </Text>
              <Text style={styles.phoneValue}>{amount}</Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={openPaymentLink}>
            <MaterialCommunityIcons
              name="open-in-new"
              size={18}
              color="white"
            />
            <Text style={styles.primaryBtnText}>
              Ouvrir le lien de paiement
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Tabs", { screen: "Commandes" })}
          >
            <Text style={styles.secondaryBtnText}>Voir mes commandes</Text>
          </Pressable>

          <Text style={styles.notice}>
            Une fois le paiement effectue, la cantine validera votre commande.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7F4" },
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
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,140,37,0.12)",
  },
  title: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
  },
  subtitle: {
    color: "#64748B",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "#F1F5F9",
  },
  badgeAccent: {
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  badgeText: {
    color: "#475569",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  badgeTextAccent: {
    color: "#059669",
  },
  logoRow: { alignItems: "center", paddingVertical: 6 },
  logo: { width: 140, height: 44 },
  phoneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  phoneLabel: {
    color: "#94A3B8",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  phoneValue: {
    color: "#334155",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#334155",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  notice: {
    color: "#94A3B8",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
});
