import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import colors from "../theme/colors";

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { profile, signOut } = useAuth();
  const isVendor = profile?.role === "vendeur";
  const isTablet = width >= 768;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const logoSize = Math.max(140, Math.min(220, width * 0.5));

  const logout = async () => {
    try { await signOut(); }
    catch (error) { Alert.alert("Déconnexion", error.message ?? "Erreur"); }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7f5" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isTablet && styles.contentWide]}
        scrollEnabled={false}
      >
        {/* Brand */}
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <Text style={styles.brand}>CANTINE CONNECTÉE</Text>
        </Animated.View>

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            { height: logoSize + 40, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View
            style={[
              styles.logoOuter,
              { width: logoSize, height: logoSize, borderRadius: logoSize / 2 },
            ]}
          >
            <Animated.View
              style={[
                styles.spinRing,
                {
                  width: logoSize,
                  height: logoSize,
                  borderRadius: logoSize / 2,
                  transform: [{ rotate: spin }],
                },
              ]}
            />
            <View
              style={[
                styles.logoInner,
                {
                  width: logoSize * 0.72,
                  height: logoSize * 0.72,
                  borderRadius: (logoSize * 0.72) / 2,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={Math.round(logoSize * 0.34)}
                color="white"
              />
            </View>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.contentSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>BIENVENUE À VOTRE</Text>
          <Text style={styles.titleAccent}>CANTINE INTELLIGENTE</Text>
          <Text style={styles.subtitle}>
            Connectez-vous pour accéder à vos services de restauration connectée
            et gérer vos repas en toute simplicité.
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            isTablet && styles.buttonsWide,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate("Produits")}
          >
            <MaterialCommunityIcons name="basket-outline" size={22} color="white" />
            <Text style={styles.primaryButtonText}>Acheteur</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="white" style={{ marginLeft: "auto" }} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedSecondary]}
            onPress={() => navigation.navigate(isVendor ? "Vendeur Produits" : "Commandes")}
          >
            <MaterialCommunityIcons
              name={isVendor ? "storefront-outline" : "clipboard-list-outline"}
              size={22}
              color={colors.primary}
            />
            <Text style={styles.secondaryButtonText}>
              {isVendor ? "Vendeur" : "Mes commandes"}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
          </Pressable>

          <Pressable style={styles.tertiaryButton} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={18} color="#94A3B8" />
            <Text style={styles.tertiaryButtonText}>Déconnexion</Text>
          </Pressable>
        </Animated.View>

        {/* Dots */}
        <View style={styles.footerDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f7f5" },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "100%",
  },
  contentWide: { maxWidth: 800, alignSelf: "center", width: "100%" },
  headerSection: { paddingTop: 18, marginBottom: 10 },
  brand: {
    color: colors.primary,
    letterSpacing: 2,
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    textAlign: "center",
  },
  logoContainer: { alignItems: "center", justifyContent: "center", marginVertical: 4 },
  logoOuter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,140,37,0.07)",
  },
  spinRing: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(244,140,37,0.22)",
  },
  logoInner: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  contentSection: { paddingHorizontal: 4, marginBottom: 24, alignItems: "center" },
  title: {
    color: "#1e293b",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 28,
    textAlign: "center",
    lineHeight: 34,
  },
  titleAccent: {
    color: colors.primary,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 36,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 42,
  },
  subtitle: {
    marginTop: 12,
    textAlign: "center",
    color: "#64748B",
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
  },
  buttonsContainer: { width: "100%", gap: 12, marginBottom: 20 },
  buttonsWide: { alignItems: "center" },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 7,
  },
  primaryButtonText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(244,140,37,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    color: "#1e293b",
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
    flex: 1,
  },
  tertiaryButton: {
    backgroundColor: "rgba(100,116,139,0.07)",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tertiaryButtonText: {
    color: "#94A3B8",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  pressedSecondary: { opacity: 0.88 },
  footerDots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(244,140,37,0.25)" },
  dotActive: { backgroundColor: colors.primary, width: 24, borderRadius: 3 },
});
