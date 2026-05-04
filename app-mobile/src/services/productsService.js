import { supabase } from "../lib/supabase";

export async function getProducts({ vendorId, includeUnavailable } = {}) {
  const query = supabase
    .from("products")
    .select(
      "id,vendor_id,nom,description,prix,category,image_url,is_available,vendors(nom_cantine,localisation,telephone)",
    )
    .order("created_at", { ascending: false });

  if (!includeUnavailable) {
    query.eq("is_available", true);
  }

  if (vendorId) {
    query.eq("vendor_id", vendorId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}
