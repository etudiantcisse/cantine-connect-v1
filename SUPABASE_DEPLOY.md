# 🚨 Déploiement Urgent - Erreur 400 RPC

## Diagnostic du Problème

L'erreur 400 Bad Request sur `create_orders_from_cart` signifie que:

1. ❌ Les permissions RPC n'ont pas été mises à jour sur Supabase
2. ❌ Ou la fonction n'existe pas avec la bonne signature
3. ❌ Ou le RPC n'accepte pas les paramètres envoyés

## Solution: Exécuter le SQL dans Supabase

### Étapes:

1. **Allez sur Supabase Console**: https://app.supabase.com
2. **Sélectionnez votre projet**: `cantine-connecte`
3. **Allez à**: `SQL Editor` → `New Query`
4. **Copiez-collez ce code** puis **exécutez** (Ctrl+Enter):

```sql
-- 1) Vérifier que la fonction existe
select routine_name, routine_type
from information_schema.routines
where routine_name = 'create_orders_from_cart'
  and routine_schema = 'public';

-- 2) Mettre à jour les permissions (crucial!)
drop function if exists public.create_orders_from_cart(jsonb, text) cascade;

create or replace function public.create_orders_from_cart(
  p_items jsonb,
  p_mode_paiement text default 'cash'
)
returns table (id uuid)
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
        || encode(gen_random_bytes(3), 'hex');
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

    id := v_order_id;
    return next;
  end loop;

  return;
end;
$$;

-- 3) Donner les permissions (TRÈS IMPORTANT!)
revoke all on function public.create_orders_from_cart(jsonb, text) from public;
grant execute on function public.create_orders_from_cart(jsonb, text) to anon, authenticated;

-- 4) Vérifier que c'est OK
select routine_name, routine_type
from information_schema.routines
where routine_name = 'create_orders_from_cart'
  and routine_schema = 'public';
```

5. **Attendez le message**: `Query executed successfully`

---

## Alternative: Tester Directement dans Supabase

Si vous voulez tester le RPC avant de redémarrer l'app:

1. **Allez à**: `SQL Editor` → `New Query`
2. **Copiez-collez**:

```sql
-- Test le RPC avec un exemple
select * from public.create_orders_from_cart(
  '[
    {
      "vendor_id": "PUT_A_VENDOR_ID_HERE",
      "items": [
        {
          "product_id": "PUT_A_PRODUCT_ID_HERE",
          "quantite": 1
        }
      ]
    }
  ]'::jsonb,
  'cash'
);
```

3. **Remplacez** `PUT_A_VENDOR_ID_HERE` et `PUT_A_PRODUCT_ID_HERE` par des IDs réels
4. **Exécutez** pour voir si ça fonctionne

---

## Après Déploiement

### 1. **Redémarrez l'app**

```bash
cd app-mobile
npm start
# Appuyez sur 's' pour recharger
```

### 2. **Testez à nouveau**

- Ajoutez des produits au panier
- Cliquez "Confirmer la commande"
- Vous devriez être redirigé vers Wave

### 3. **Si ça échoue encore**

Allez à: **Chrome DevTools** → **Network** → Regardez la requête POST vers `/rpc/create_orders_from_cart`

- ✅ Vérifiez que le status est 200 (pas 400)
- ✅ Vérifiez que `response.data` contient `[{id: "uuid"}]`

---

## Checklist Finale

- ✅ SQL exécuté sur Supabase
- ✅ App redémarrée
- ✅ Teste avec réel product + vendor
- ✅ Vérifie que les commandes sont créées dans Supabase → `orders`
