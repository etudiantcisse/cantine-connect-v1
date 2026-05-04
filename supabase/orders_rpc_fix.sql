-- Fix RPC return shape for PostgREST /rest/v1/rpc/create_orders_from_cart
-- Run this in Supabase SQL Editor (as admin).

create or replace function public.create_orders_from_cart(
  p_items jsonb,
  p_mode_paiement text default 'cash'
)
returns table (order_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group jsonb;
  v_item jsonb;
  v_order_id uuid;
  v_vendor_id uuid;
  v_product_id uuid;
  v_quantite integer;
  v_prix numeric(12,2);
  v_total numeric(12,2);
  v_platform_fee numeric(12,2);
  v_vendor_amount numeric(12,2);
  v_payment_reference text;
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifie';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  for v_group in select * from jsonb_array_elements(p_items)
  loop
    v_vendor_id := (v_group ->> 'vendor_id')::uuid;
    v_total := 0;

    if v_vendor_id is null then
      raise exception 'Vendor manquant';
    end if;

    for v_item in select * from jsonb_array_elements(v_group -> 'items')
    loop
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantite := coalesce((v_item ->> 'quantite')::integer, 0);

      if v_product_id is null or v_quantite <= 0 then
        raise exception 'Produit/quantite invalide';
      end if;

      select prix
      into v_prix
      from public.products
      where id = v_product_id
        and vendor_id = v_vendor_id
        and is_available = true;

      if v_prix is null then
        raise exception 'Produit introuvable ou indisponible';
      end if;

      v_total := v_total + (v_prix * v_quantite);
    end loop;

    v_platform_fee := round(v_total * 0.05, 2);
    v_vendor_amount := v_total - v_platform_fee;
    v_payment_reference := null;

    if p_mode_paiement in ('wave', 'orange_money') then
      v_payment_reference :=
        upper(p_mode_paiement)
        || '-'
        || to_char(now(), 'YYYYMMDDHH24MISS')
        || '-'
        || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    end if;

    insert into public.orders (
      user_id,
      vendor_id,
      total,
      mode_paiement,
      status,
      payment_status,
      payment_reference,
      platform_fee,
      vendor_amount
    )
    values (
      auth.uid(),
      v_vendor_id,
      v_total,
      p_mode_paiement,
      'en_attente',
      'pending',
      v_payment_reference,
      v_platform_fee,
      v_vendor_amount
    )
    returning id into v_order_id;

    for v_item in select * from jsonb_array_elements(v_group -> 'items')
    loop
      insert into public.order_items (order_id, product_id, quantite)
      values (
        v_order_id,
        (v_item ->> 'product_id')::uuid,
        (v_item ->> 'quantite')::integer
      );
    end loop;

    order_id := v_order_id;
    return next;
  end loop;

  return;
end;
$$;

revoke all on function public.create_orders_from_cart(jsonb, text) from public;
grant execute on function public.create_orders_from_cart(jsonb, text) to anon, authenticated;
