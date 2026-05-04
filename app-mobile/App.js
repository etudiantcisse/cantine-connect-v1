import { NavigationContainer } from "@react-navigation/native";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import AppNavigator from "./src/navigation/AppNavigator";

// Suppress known harmless warnings on web
const originalWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("pointerEvents is deprecated") ||
      args[0].includes("shadow") ||
      args[0].includes("Non-serializable values"))
  ) {
    return; // Suppress these specific warnings
  }
  originalWarn.apply(console, args);
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [
      Text.defaultProps.style,
      { fontFamily: "Manrope_500Medium" },
    ];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [
      TextInput.defaultProps.style,
      { fontFamily: "Manrope_500Medium" },
    ];
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F3F4F6",
          gap: 12,
        }}
      >
        <Image
          source={require("./assets/logo.png")}
          style={{ width: 96, height: 96, resizeMode: "contain" }}
        />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ color: "#6B7280", fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
