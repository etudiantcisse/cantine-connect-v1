import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image } from "react-native";
import LoadingView from "../components/LoadingView";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import CartScreen from "../screens/CartScreen";
import FinancialReportsScreen from "../screens/FinancialReportsScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import OrdersScreen from "../screens/OrdersScreen";
import PaymentPendingScreen from "../screens/PaymentPendingScreen";
import ProductsScreen from "../screens/ProductsScreen";
import SignupScreen from "../screens/SignupScreen";
import VendorOrdersScreen from "../screens/VendorOrdersScreen";
import VendorProfileScreen from "../screens/VendorProfileScreen";
import VendorProductsScreen from "../screens/VendorProductsScreen";
import colors from "../theme/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Connexion" }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: "Inscription" }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { profile } = useAuth();
  const { cartCount } = useCart();
  const isVendor = profile?.role === "vendeur";

  const getTabIcon = (routeName, focused) => {
    const color = focused ? colors.primary : colors.mutedText;
    switch (routeName) {
      case "Accueil":
        return (
          <MaterialCommunityIcons name="home-variant" size={20} color={color} />
        );
      case "Produits":
        return (
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 20, height: 20, opacity: focused ? 1 : 0.6 }}
            resizeMode="contain"
            accessible
            accessibilityLabel="Logo Cantine Connectee"
          />
        );
      case "Panier":
        return (
          <MaterialCommunityIcons
            name="basket-outline"
            size={20}
            color={color}
          />
        );
      case "Commandes":
        return (
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={20}
            color={color}
          />
        );
      case "Vendeur Produits":
        return (
          <MaterialCommunityIcons
            name="storefront-outline"
            size={20}
            color={color}
          />
        );
      case "Vendeur Commandes":
        return (
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={20}
            color={color}
          />
        );
      case "Ma Cantine":
        return (
          <MaterialCommunityIcons
            name="store-outline"
            size={20}
            color={color}
          />
        );
      case "Rapports":
        return (
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={20}
            color={color}
          />
        );
      default:
        return (
          <MaterialCommunityIcons
            name="circle-outline"
            size={20}
            color={color}
          />
        );
    }
  };

  return (
    <Tab.Navigator
      key={isVendor ? "vendor-tabs" : "buyer-tabs"}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontFamily: "Manrope_700Bold",
          fontSize: 11,
        },
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopColor: colors.border,
          backgroundColor: "#FCFCFC",
        },
        tabBarIcon: ({ focused }) => getTabIcon(route.name, focused),
      })}
    >
      {isVendor ? (
        <>
          <Tab.Screen name="Accueil" component={HomeScreen} />
          <Tab.Screen
            name="Vendeur Produits"
            component={VendorProductsScreen}
            options={{ title: "Mes produits", headerShown: false }}
          />
          <Tab.Screen
            name="Ma Cantine"
            component={VendorProfileScreen}
            options={{ title: "Ma cantine", headerShown: false }}
          />
          <Tab.Screen
            name="Vendeur Commandes"
            component={VendorOrdersScreen}
            options={{ title: "Commandes vendeur", headerShown: false }}
          />
          <Tab.Screen
            name="Rapports"
            component={FinancialReportsScreen}
            options={{
              title: "Rapports",
              headerShown: false,
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen name="Accueil" component={HomeScreen} />
          <Tab.Screen
            name="Produits"
            component={ProductsScreen}
            options={{ title: "Menu", headerShown: false }}
          />
          <Tab.Screen
            name="Panier"
            component={CartScreen}
            options={{
              title: cartCount > 0 ? `Panier (${cartCount})` : "Panier",
              headerShown: false,
            }}
          />
          <Tab.Screen
            name="Commandes"
            component={OrdersScreen}
            options={{ title: "Mes commandes", headerShown: false }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="Paiement" component={PaymentPendingScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingView />;
  }

  return isAuthenticated ? <MainStack /> : <AuthStack />;
}
