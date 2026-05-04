import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ORDER_STATUS } from "../constants/orders";
import colors from "../theme/colors";

const STATUS_STEPS = [
  ORDER_STATUS.EN_ATTENTE,
  ORDER_STATUS.EN_PREPARATION,
  ORDER_STATUS.PRETE,
  ORDER_STATUS.LIVREE,
];

function formatPrice(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("fr-FR")} FCFA`;
}

function getStatusLabel(status) {
  switch (status) {
    case "en_attente":
      return "En attente";
    case "en_preparation":
      return "En preparation";
    case "prete":
      return "Prete";
    case "livree":
      return "Livree";
    case "annulee":
      return "Annulee";
    default:
      return status;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "en_attente":
      return colors.warning;
    case "en_preparation":
      return "#2563EB";
    case "prete":
      return colors.success;
    case "livree":
      return "#0F766E";
    case "annulee":
      return colors.danger;
    default:
      return colors.mutedText;
  }
}

function getPaymentStatusLabel(status) {
  switch (status) {
    case "paid":
      return "Paiement confirme";
    case "failed":
      return "Paiement echoue";
    case "refunded":
      return "Paiement rembourse";
    default:
      return "Paiement en attente";
  }
}

export default function OrderCard({ order, onCancel, onPay }) {
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const canCancel = order.status === "en_attente";
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCanceled = order.status === ORDER_STATUS.ANNULEE;
  const canPay =
    order.payment_status === "pending" &&
    order.mode_paiement &&
    order.mode_paiement !== "cash";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View
          style={[styles.badge, { borderColor: getStatusColor(order.status) }]}
        >
          <Text
            style={[styles.badgeText, { color: getStatusColor(order.status) }]}
          >
            {getStatusLabel(order.status)}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date(order.created_at).toLocaleString("fr-FR")}
        </Text>
      </View>

      <Text style={styles.vendor}>
        {order.vendors?.nom_cantine ?? "Cantine"}
      </Text>
      <Text style={styles.location}>
        {order.vendors?.localisation ?? "Campus"}
      </Text>

      <View style={styles.timelineWrap}>
        <Text style={styles.timelineTitle}>Timeline commande</Text>
        <View
          style={[styles.timelineRow, compact && styles.timelineRowCompact]}
        >
          {STATUS_STEPS.map((step, index) => {
            const isDone = !isCanceled && index <= currentStepIndex;
            const isCurrent = !isCanceled && index === currentStepIndex;

            return (
              <View
                key={step}
                style={[
                  styles.timelineStep,
                  compact && styles.timelineStepCompact,
                ]}
              >
                <View
                  style={[
                    styles.timelineDot,
                    isDone && styles.timelineDotDone,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                />
                <Text
                  style={[
                    styles.timelineLabel,
                    isDone && styles.timelineLabelDone,
                  ]}
                >
                  {getStatusLabel(step)}
                </Text>
              </View>
            );
          })}
        </View>
        {isCanceled ? (
          <Text style={styles.canceledText}>
            Commande annulee par l'utilisateur.
          </Text>
        ) : null}
      </View>

      <View style={styles.itemsWrap}>
        {(order.order_items ?? []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantite}x</Text>
            <Text style={styles.itemName}>
              {item.products?.nom ?? "Produit"}
            </Text>
            <Text style={styles.itemPrice}>
              {formatPrice(item.products?.prix)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.total}>Total: {formatPrice(order.total)}</Text>
          <Text style={styles.paymentStatus}>
            {getPaymentStatusLabel(order.payment_status)}
          </Text>
          {order.payment_reference ? (
            <Text style={styles.paymentRef}>
              Ref: {order.payment_reference}
            </Text>
          ) : null}
        </View>
        <View style={styles.footerActions}>
          {canPay && typeof onPay === "function" ? (
            <Pressable onPress={() => onPay(order)}>
              <Text style={styles.pay}>Payer</Text>
            </Pressable>
          ) : null}
          {canCancel ? (
            <Pressable onPress={() => onCancel(order.id)}>
              <Text style={styles.cancel}>Annuler</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  footerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  date: {
    color: colors.mutedText,
    fontSize: 11,
  paymentRef: {
    color: colors.mutedText,
    fontSize: 11,
  },
  pay: {
    color: colors.primary,
    fontWeight: "700",
  },
  },
  vendor: {
    color: colors.text,
    fontWeight: "700",
  },
  location: {
    color: colors.mutedText,
    fontSize: 12,
  },
  timelineWrap: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  timelineTitle: {
    fontSize: 12,
    color: colors.mutedText,
    fontWeight: "700",
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    flexWrap: "wrap",
  },
  timelineRowCompact: {
    justifyContent: "flex-start",
  },
  timelineStep: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  timelineStepCompact: {
    minWidth: "48%",
    flex: 0,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },
  timelineDotDone: {
    backgroundColor: colors.success,
  },
  timelineDotCurrent: {
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
  },
  timelineLabel: {
    fontSize: 10,
    color: colors.mutedText,
    textAlign: "center",
  },
  timelineLabelDone: {
    color: colors.text,
    fontWeight: "700",
  },
  canceledText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "600",
  },
  itemsWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemQty: {
    minWidth: 26,
    color: colors.primary,
    fontWeight: "700",
  },
  itemName: {
    flex: 1,
    color: colors.text,
  },
  itemPrice: {
    color: colors.mutedText,
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    color: colors.primary,
    fontWeight: "800",
  },
  paymentStatus: {
    color: colors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  cancel: {
    color: colors.danger,
    fontWeight: "700",
  },
});
