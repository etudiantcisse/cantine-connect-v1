import { ORDER_STATUS } from "../constants/orders";
import { supabase } from "../lib/supabase";

export async function getVendorByProfile(profileId) {
  const { data, error } = await supabase
    .from("vendors")
    .select("id,profile_id,nom_cantine,localisation,telephone")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createVendorIfMissing({
  profileId,
  nomCantine,
  localisation,
  telephone,
}) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile?.role !== "vendeur") {
    throw new Error("Seuls les comptes vendeur peuvent creer une cantine.");
  }

  const existing = await getVendorByProfile(profileId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("vendors")
    .insert({
      profile_id: profileId,
      nom_cantine: nomCantine,
      localisation,
      telephone,
    })
    .select("id,profile_id,nom_cantine,localisation,telephone")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getVendorProducts(vendorId) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,vendor_id,nom,description,prix,category,is_available,image_url,created_at",
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createVendorProduct({
  vendorId,
  nom,
  description,
  prix,
  category,
}) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      vendor_id: vendorId,
      nom,
      description,
      prix,
      category,
      is_available: true,
    })
    .select(
      "id,vendor_id,nom,description,prix,category,is_available,image_url,created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateVendorProduct({
  productId,
  nom,
  description,
  prix,
  category,
}) {
  const { data, error } = await supabase
    .from("products")
    .update({
      nom,
      description,
      prix,
      category,
    })
    .eq("id", productId)
    .select(
      "id,vendor_id,nom,description,prix,category,is_available,image_url,created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteVendorProduct(productId) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw error;
  }
}

export async function updateVendorProductAvailability(productId, isAvailable) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId)
    .select("id,is_available")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getVendorOrders(vendorId) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,user_id,vendor_id,total,mode_paiement,status,payment_status,payment_reference,paid_at,platform_fee,vendor_amount,note,created_at,profiles(nom,prenom,telephone),order_items(id,quantite,products(nom,prix))",
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateVendorOrderStatus(orderId, status) {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new Error("Statut invalide");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("id,status")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
