import { supabase } from "../lib/supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,vendor_id,nom,description,prix,category,image_url,is_available,vendors(nom_cantine,localisation,telephone)",
    )
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
