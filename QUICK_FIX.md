# 🚀 SOLUTION RAPIDE - Erreur 400 RPC (Copier-Coller)

## MAINTENANT - 5 Minutes pour Fixer

### **ÉTAPE 1: Aller sur Supabase**

1. Ouvrez: https://app.supabase.com
2. Entrez votre **email** et **mot de passe**
3. Sélectionnez votre projet: `cantine-connecte`
4. Cliquez sur le menu gauche: **SQL Editor**
5. Cliquez: **New Query** (ou Ctrl+K)

---

### **ÉTAPE 2: Copier le SQL ci-dessous**

Sélectionnez **TOUT** le code entre les lignes en pointillé:

```
═══════════════════════════════════════════════════════════════════
```

```sql
DROP FUNCTION IF EXISTS public.create_orders_from_cart(jsonb, text) CASCADE;

CREATE OR REPLACE FUNCTION public.create_orders_from_cart(
  p_items jsonb,
  p_mode_paiement text DEFAULT 'cash'
)
RETURNS TABLE (id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifie';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Panier vide';
  END IF;

  FOR v_group IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_vendor_id := (v_group ->> 'vendor_id')::uuid;
    v_total := 0;

    IF v_vendor_id IS NULL THEN
      RAISE EXCEPTION 'Vendor manquant';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_group -> 'items')
    LOOP
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantite := COALESCE((v_item ->> 'quantite')::integer, 0);

      IF v_product_id IS NULL OR v_quantite <= 0 THEN
        RAISE EXCEPTION 'Produit/quantite invalide';
      END IF;

      SELECT prix
      INTO v_prix
      FROM public.products
      WHERE id = v_product_id
        AND vendor_id = v_vendor_id
        AND is_available = true;

      IF v_prix IS NULL THEN
        RAISE EXCEPTION 'Produit introuvable ou indisponible';
      END IF;

      v_total := v_total + (v_prix * v_quantite);
    END LOOP;

    v_platform_fee := ROUND(v_total * 0.05, 2);
    v_vendor_amount := v_total - v_platform_fee;
    v_payment_reference := NULL;

    IF p_mode_paiement IN ('wave', 'orange_money') THEN
      v_payment_reference :=
        UPPER(p_mode_paiement)
        || '-'
        || TO_CHAR(now(), 'YYYYMMDDHH24MISS')
        || '-'
        || ENCODE(gen_random_bytes(3), 'hex');
    END IF;

    INSERT INTO public.orders (
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
    VALUES (
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
    RETURNING orders.id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_group -> 'items')
    LOOP
      INSERT INTO public.order_items (order_id, product_id, quantite)
      VALUES (
        v_order_id,
        (v_item ->> 'product_id')::uuid,
        (v_item ->> 'quantite')::integer
      );
    END LOOP;

    id := v_order_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.create_orders_from_cart(jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_orders_from_cart(jsonb, text) TO anon, authenticated;
```

```
═══════════════════════════════════════════════════════════════════
```

---

### **ÉTAPE 3: Coller dans Supabase**

1. **Cliquez** dans la zone de texte blanche (SQL Editor)
2. **Ctrl+A** pour sélectionner tout ce qui était là avant
3. **Supprimer** le texte précédent (Delete ou Backspace)
4. **Ctrl+V** pour coller le nouveau SQL

---

### **ÉTAPE 4: Exécuter le SQL**

1. Cliquez le bouton bleu **"Run"** (en haut à droite)
   OU Appuyez: **Ctrl+Enter**

2. **Attendez** jusqu'à voir:

   ```
   ✅ Query executed successfully (1 result)
   ```

3. **⚠️ SI vous voyez une erreur:**
   - Copiez le message d'erreur
   - Envoyez-moi exactement ce qu'il dit

---

### **ÉTAPE 5: Vérifier que ça marche**

**Nouvelle query dans Supabase:**

Sélectionnez ce code et exécutez-le:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'create_orders_from_cart'
  AND routine_schema = 'public';
```

**Résultat attendu:**

```
routine_name              | routine_type
=================================================
create_orders_from_cart   | FUNCTION
```

Si vous voyez ça → ✅ **C'est bon!**

---

### **ÉTAPE 6: Redémarrer l'App**

Ouvrez **PowerShell** et tapez:

```powershell
cd C:\Users\BCISSE\Documents\ecantine\app-mobile
npm start
```

Attendez que ça affiche:

```
› Metro waiting on exp://...
```

Appuyez sur **`s`** pour recharger l'app

---

### **ÉTAPE 7: Tester dans l'App**

1. **Lancez l'app** (Expo Go)
2. **Connectez-vous** en tant qu'acheteur
3. **Ajoutez un produit** au panier
4. **Cliquez "Panier"**
5. **Choisissez "Wave"** (paiement)
6. **Entrez votre numéro**: `77123456789`
7. **Cliquez "Confirmer la commande"**

### **Résultat attendu:**

✅ **Succès**: L'écran change → redirection Wave

❌ **Erreur 400**: Toujours visible?
→ Vérifie la console (voir FIX_400_ERROR_COMPLETE_GUIDE.md)

---

## Si Ça Marche: 🎉

Les commandes vont maintenant:

- ✅ Se créer dans Supabase
- ✅ Vous rediriger vers Wave/Orange Money
- ✅ Apparaître dans "Mes commandes"

---

## Si Ça N'Marche Toujours Pas

**Envoyez-moi:**

1. L'erreur exacte que vous voyez dans la console
2. Le résultat de `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'create_orders_from_cart'`
3. Confirmation que vous avez exécuté TOUT le SQL ci-dessus

---

## ⏱️ Temps Total: ~5 minutes

- Supabase: 2 min
- SQL: 1 min
- Reload app: 1 min
- Test: 1 min
