import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import colors from "../theme/colors";
import { formatFcfa } from "../utils/currency";

function getIconByCategory(category) {
  switch (category) {
    case "plat":
      return "silverware-fork-knife";
    case "boisson":
      return "cup";
    case "dessert":
      return "cake-variant";
    case "snack":
      return "food";
    default:
      return "silverware";
  }
}

export default function ProductCard({ product, onOrder, onAddToCart }) {
  const handleOrder = () => {
    if (typeof onOrder !== "function") {
      Alert.alert("Commande", "Action indisponible.");
      return;
    }

    Promise.resolve(onOrder(product)).catch((error) => {
      Alert.alert("Commande", error?.message ?? "Erreur lors de la commande");
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.mediaWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={getIconByCategory(product.category)}
              size={34}
              color={colors.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.infoWrap}>
        <Text style={styles.name} numberOfLines={1}>
          {product.nom}
        </Text>
        <Text style={styles.vendor} numberOfLines={1}>
          {product.vendors?.nom_cantine ?? "Cantine"}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {product.description}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatFcfa(product.prix)}</Text>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.plusButton}
              onPress={() => onAddToCart(product)}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={colors.primary}
              />
            </Pressable>
            <Pressable style={styles.button} onPress={handleOrder}>
              <Text style={styles.buttonText}>Commander</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    minHeight: 116,
  },
  mediaWrap: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  iconWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoWrap: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    color: colors.text,
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
  },
  vendor: {
    color: colors.secondary,
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
  description: {
    color: colors.mutedText,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  bottomRow: {
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  price: {
    color: colors.primary,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 34,
  },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
});
