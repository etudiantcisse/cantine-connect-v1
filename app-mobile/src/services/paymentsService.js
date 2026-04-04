import { supabase } from "../lib/supabase";

export async function markOrderPaid(orderId, paymentReference = null) {
  if (!orderId) {
    throw new Error("Commande invalide");
  }

  const { data, error } = await supabase.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_payment_reference: paymentReference,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getVendorWallet() {
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (vendorError) {
    throw vendorError;
  }

  if (!vendor?.id) {
    return null;
  }

  const { data: wallet, error: walletError } = await supabase
    .from("vendor_wallets")
    .select("vendor_id,balance,currency,updated_at")
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (walletError) {
    throw walletError;
  }

  return wallet;
}

export async function getVendorWalletLedger(limit = 20) {
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (vendorError) {
    throw vendorError;
  }

  if (!vendor?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("vendor_wallet_ledger")
    .select("id,vendor_id,order_id,entry_type,amount,note,meta,created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function requestVendorPayout({
  amount,
  method = "manual",
  accountRef = null,
}) {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Montant invalide");
  }

  const { data, error } = await supabase.rpc("request_vendor_payout", {
    p_amount: parsedAmount,
    p_method: method,
    p_account_ref: accountRef,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getVendorPayouts(limit = 20) {
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (vendorError) {
    throw vendorError;
  }

  if (!vendor?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("payouts")
    .select(
      "id,vendor_id,amount,method,account_ref,status,external_reference,processed_at,created_at",
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
