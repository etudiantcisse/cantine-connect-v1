import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react-native/dist/cjs/lucide-react-native.js";
import { useAuth } from "../hooks/useAuth";
import colors from "../theme/colors";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { signIn, authError } = useAuth();

  const isTablet = width >= 768;
  const isWide = width >= 900;

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Tous les champs sont requis");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signIn({ email: email.trim(), password });
    } catch (err) {
      setError(err.message || authError || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const logoSize = Math.max(
    120,
    Math.min(160, width * (isTablet ? 0.18 : 0.32)),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Decorative Elements */}
        <View style={styles.decorativeTopLeft} />
        <View style={styles.decorativeBottomRight} />

        {/* Main Card */}
        <View style={[styles.card, isWide && styles.cardWide]}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View
              style={[styles.logoBg, { width: logoSize, height: logoSize }]}
            >
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
                accessible
                accessibilityLabel="Logo Cantine Connectee"
              />
            </View>
            <Text style={styles.brandName}>Cantine Connectée</Text>
            <Text style={styles.brandTagline}>
              Connectez-vous pour commander
            </Text>
          </View>

          {/* Error Message */}
          {(error || authError) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error || authError}</Text>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="votre.email@example.com"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="email-address"
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  autoCorrect={false}
                  autoCapitalize="none"
                  editable={!loading}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez votre mot de passe"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff color={colors.mutedText} size={18} />
                  ) : (
                    <Eye color={colors.mutedText} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Pas encore inscrit ? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Signup")}
                disabled={loading}
              >
                <Text style={styles.signupLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <View style={styles.infoBullet}>
              <CheckCircle color={colors.success} size={18} />
              <Text style={styles.bulletText}>
                Commandes faciles et rapides
              </Text>
            </View>
            <View style={styles.infoBullet}>
              <CheckCircle color={colors.success} size={18} />
              <Text style={styles.bulletText}>Paiement sécurisé</Text>
            </View>
            <View style={styles.infoBullet}>
              <CheckCircle color={colors.success} size={18} />
              <Text style={styles.bulletText}>Suivi en temps réel</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "center",
  },
  decorativeTopLeft: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  decorativeBottomRight: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.secondary,
    opacity: 0.08,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  cardWide: {
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBg: {
    backgroundColor: "transparent",
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  logoImage: {
    width: "70%",
    height: "70%",
  },
  logoIcon: {
    fontSize: 48,
  },
  brandName: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  brandTagline: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#991B1B",
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: colors.mutedText,
    marginHorizontal: 12,
    textTransform: "uppercase",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  signupText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.mutedText,
  },
  signupLink: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: colors.primary,
  },
  footerInfo: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  infoBullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bulletText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: colors.mutedText,
    flex: 1,
  },
});

export default LoginScreen;
