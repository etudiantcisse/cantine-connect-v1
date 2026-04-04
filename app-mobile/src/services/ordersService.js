import { supabase } from "../lib/supabase";

export async function getOrdersByUser(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,user_id,vendor_id,total,mode_paiement,status,payment_status,payment_reference,paid_at,platform_fee,vendor_amount,note,created_at,vendors(nom_cantine,localisation),order_items(id,order_id,product_id,quantite,products(nom,prix,image_url))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createSimpleOrder({
  userId,
  product,
  quantite = 1,
  modePaiement = "cash",
}) {
  if (!userId) {
    throw new Error("Utilisateur non authentifie");
  }

  const { data, error } = await supabase.rpc("create_order_with_item", {
    p_product_id: product.id,
    p_quantite: quantite,
    p_mode_paiement: modePaiement,
  });

  if (error) {
    throw error;
  }

  return { id: data };
}

export async function checkoutCart({ groupedByVendor, modePaiement = "cash" }) {
  if (!Array.isArray(groupedByVendor) || groupedByVendor.length === 0) {
    throw new Error("Panier vide");
  }

  const payload = groupedByVendor.map((group) => ({
    vendor_id: group.vendorId,
    items: group.items.map((item) => ({
      product_id: item.product.id,
      quantite: item.quantity,
    })),
  }));

  const { data, error } = await supabase.rpc("create_orders_from_cart", {
    p_items: payload,
    p_mode_paiement: modePaiement,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function cancelOrder(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "annulee" })
    .eq("id", orderId)
    .eq("status", "en_attente")
    .select("id");

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Commande non annulable ou introuvable");
  }
}
