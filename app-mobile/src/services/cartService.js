import { supabase } from "../lib/supabase";

export async function getRemoteCartItems() {
  const { data, error } = await supabase.rpc("cart_get_items");
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => ({
    product: row.product ?? null,
    quantity: row.quantity ?? 0,
  }));
}

export async function upsertRemoteCartItem(productId, quantity) {
  const { error } = await supabase.rpc("cart_upsert_item", {
    p_product_id: productId,
    p_quantity: quantity,
  });
  if (error) throw error;
}

export async function removeRemoteCartItem(productId) {
  const { error } = await supabase.rpc("cart_remove_item", {
    p_product_id: productId,
  });
  if (error) throw error;
}

export async function clearRemoteCart() {
  const { error } = await supabase.rpc("cart_clear");
  if (error) throw error;
}

