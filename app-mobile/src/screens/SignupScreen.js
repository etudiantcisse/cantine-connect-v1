import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import colors from "../theme/colors";

const { width, height } = Dimensions.get("window");

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    nomCantine: "",
    localisation: "",
    password: "",
    confirmPassword: "",
    role: "etudiant",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const { signUp, authError } = useAuth();

  const isTablet = width >= 768;
  const isWide = width >= 900;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setError("Le nom est requis");
      return false;
    }
    if (!formData.prenom.trim()) {
      setError("Le prénom est requis");
      return false;
    }
    if (!formData.email.trim()) {
      setError("L'email est requis");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email invalide");
      return false;
    }
    if (!formData.telephone.trim()) {
      setError("Le téléphone est requis");
      return false;
    }
    if (formData.role === "vendeur" && !formData.nomCantine.trim()) {
      setError("Le nom de la cantine est requis pour un vendeur");
      return false;
    }
    if (formData.role === "vendeur" && !formData.localisation.trim()) {
      setError("La localisation de la cantine est requise pour un vendeur");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Le mot de passe doit avoir au moins 6 caractères");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");
      const result = await signUp({
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        nomCantine:
          formData.role === "vendeur" ? formData.nomCantine.trim() : null,
        localisation:
          formData.role === "vendeur" ? formData.localisation.trim() : null,
        password: formData.password,
        role: formData.role,
      });

      if (result.emailConfirmationRequired) {
        setError("Compte créé! Vérifiez votre email pour confirmer.");
      }
    } catch (err) {
      setError(err.message || authError || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  const logoSize = Math.max(
    100,
    Math.min(140, width * (isTablet ? 0.15 : 0.28)),
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
              <Text style={styles.logoIcon}>👤</Text>
            </View>
            <Text style={styles.brandName}>Créer un compte</Text>
            <Text style={styles.brandTagline}>Rejoignez Cantine Connectée</Text>
          </View>

          {/* Error Message */}
          {(error || authError) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error || authError}</Text>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Nom & Prenom Row */}
            <View style={styles.rowContainer}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nom</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom"
                    placeholderTextColor={colors.mutedText}
                    editable={!loading}
                    value={formData.nom}
                    onChangeText={(value) => handleInputChange("nom", value)}
                  />
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Prénom</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre prénom"
                    placeholderTextColor={colors.mutedText}
                    editable={!loading}
                    value={formData.prenom}
                    onChangeText={(value) => handleInputChange("prenom", value)}
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="votre.email@example.com"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                />
              </View>
            </View>

            {/* Telephone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="+221 XX XXX XXXX"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="phone-pad"
                  editable={!loading}
                  value={formData.telephone}
                  onChangeText={(value) =>
                    handleInputChange("telephone", value)
                  }
                />
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rôle</Text>
              <View style={styles.roleContainer}>
                {["etudiant", "vendeur"].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && styles.roleButtonActive,
                    ]}
                    onPress={() => handleInputChange("role", role)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextActive,
                      ]}
                    >
                      {role === "etudiant" ? "👨‍🎓 Étudiant" : "🏪 Vendeur"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {formData.role === "vendeur" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom de la cantine</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Cantine du Campus"
                      placeholderTextColor={colors.mutedText}
                      editable={!loading}
                      value={formData.nomCantine}
                      onChangeText={(value) =>
                        handleInputChange("nomCantine", value)
                      }
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Localisation</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Campus UCAD"
                      placeholderTextColor={colors.mutedText}
                      editable={!loading}
                      value={formData.localisation}
                      onChangeText={(value) =>
                        handleInputChange("localisation", value)
                      }
                    />
                  </View>
                </View>
              </>
            )}

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 caractères"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.eyeIconText}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirmez votre mot de passe"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry={!showConfirm}
                  editable={!loading}
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirm(!showConfirm)}
                  disabled={loading}
                >
                  <Text style={styles.eyeIconText}>
                    {showConfirm ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà inscrit ? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Info */}
          <View style={styles.termsInfo}>
            <Text style={styles.termsText}>
              En créant un compte, vous acceptez nos{" "}
              <Text style={styles.termsLink}>conditions d'utilisation</Text> et{" "}
              <Text style={styles.termsLink}>politique de confidentialité</Text>
              .
            </Text>
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
    paddingVertical: 20,
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
    paddingVertical: 28,
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
    marginBottom: 24,
  },
  logoBg: {
    backgroundColor: colors.secondary,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  brandName: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 22,
    color: colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  brandTagline: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.mutedText,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: "#991B1B",
  },
  formSection: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
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
    height: 44,
  },
  input: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  eyeIconText: {
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: colors.mutedText,
  },
  roleButtonTextActive: {
    color: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    color: colors.mutedText,
    marginHorizontal: 10,
    textTransform: "uppercase",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  loginText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: colors.mutedText,
  },
  loginLink: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    color: colors.primary,
  },
  termsInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  termsText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.primary,
  },
});

export default SignupScreen;
