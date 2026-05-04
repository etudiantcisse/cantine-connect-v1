# 🔧 Guide Complet - Corriger l'Erreur 400 du RPC

## Erreur Actuelle

```
POST /rest/v1/rpc/create_orders_from_cart 400 Bad Request
```

---

## 🎯 Causes Possibles (dans l'ordre de probabilité)

1. **❌ Les permissions n'ont pas été mises à jour** → Le SQL n'a pas été exécuté sur Supabase
2. **❌ Format des données incorrect** → Le payload JSON n'est pas au bon format
3. **❌ Fonction n'existe pas** → La fonction ne s'appelle pas exactement `create_orders_from_cart`
4. **❌ Problème d'authentification** → L'utilisateur n'est pas correctement authentifié

---

## ✅ Solution Étape par Étape

### **Étape 1: Vérifier Supabase Dashboard**

1. Allez à: **https://app.supabase.com**
2. Sélectionnez votre projet `cantine-connecte`
3. Cliquez sur **"SQL Editor"**

---

### **Étape 2: Exécuter le Diagnostic SQL**

Créez une **nouvelle query** et exécutez ce code:

```sql
-- DIAGNOSTIC: Vérifier si la fonction existe
SELECT
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_orders_from_cart'
  AND routine_schema = 'public'
ORDER BY routine_name;
```

**Résultats attendus:**

- ✅ Vous devez voir 1 ligne avec `routine_name = 'create_orders_from_cart'`
- ✅ `routine_type = 'FUNCTION'`
- ✅ La définition doit contenir `returns table (id uuid)`

**Si vous ne voyez rien:**
➜ La fonction n'existe pas. Allez à l'étape 3.

---

### **Étape 3: Recréer la Fonction (SI NÉCESSAIRE)**

Si la fonction n'existe pas, exécutez ce SQL complet:

```sql
-- 1) Supprimer l'ancienne version (si elle existe)
DROP FUNCTION IF EXISTS public.create_orders_from_cart(jsonb, text) CASCADE;

-- 2) Créer la nouvelle fonction
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
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifie';
  END IF;

  -- Vérifier le panier
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Panier vide';
  END IF;

  -- Itérer sur chaque groupe de vendeur
  FOR v_group IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_vendor_id := (v_group ->> 'vendor_id')::uuid;
    v_total := 0;

    IF v_vendor_id IS NULL THEN
      RAISE EXCEPTION 'Vendor manquant';
    END IF;

    -- Calculer le total pour ce vendeur
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

    -- Calculer les frais
    v_platform_fee := ROUND(v_total * 0.05, 2);
    v_vendor_amount := v_total - v_platform_fee;
    v_payment_reference := NULL;

    -- Générer la référence pour les paiements en ligne
    IF p_mode_paiement IN ('wave', 'orange_money') THEN
      v_payment_reference :=
        UPPER(p_mode_paiement)
        || '-'
        || TO_CHAR(now(), 'YYYYMMDDHH24MISS')
        || '-'
        || ENCODE(gen_random_bytes(3), 'hex');
    END IF;

    -- Créer la commande
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

    -- Créer les items de la commande
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_group -> 'items')
    LOOP
      INSERT INTO public.order_items (order_id, product_id, quantite)
      VALUES (
        v_order_id,
        (v_item ->> 'product_id')::uuid,
        (v_item ->> 'quantite')::integer
      );
    END LOOP;

    -- Retourner l'ID de la commande
    id := v_order_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- 3) IMPORTANT: Donner les permissions
REVOKE ALL ON FUNCTION public.create_orders_from_cart(jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_orders_from_cart(jsonb, text) TO anon, authenticated;

-- 4) Vérifier le résultat
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'create_orders_from_cart'
  AND routine_schema = 'public';
```

**⚠️ IMPORTANT:**

- Exécutez le code EN ENTIER (pas par morceaux)
- Attendez le message `Query executed successfully`
- Ne fermez pas le navigateur

---

### **Étape 4: Tester le RPC Directement dans Supabase**

Avant de tester dans l'app, testez le RPC directement:

```sql
-- 1) D'abord, trouvez les IDs réels
SELECT id, nom, prix FROM public.products LIMIT 1;
SELECT id FROM public.vendors LIMIT 1;

-- 2) Puis testez le RPC avec ces IDs
SELECT * FROM public.create_orders_from_cart(
  '[
    {
      "vendor_id": "REMPLACEZ_PAR_VENDOR_ID",
      "items": [
        {
          "product_id": "REMPLACEZ_PAR_PRODUCT_ID",
          "quantite": 1
        }
      ]
    }
  ]'::jsonb,
  'cash'
);
```

**Résultat attendu:**

```
id
----
f47ac10b-58cc-4372-a567-0e02b2c3d479
```

Si vous voyez une erreur, copiez-la entièrement et envoyez-la.

---

### **Étape 5: Redémarrer l'App**

```bash
cd c:\Users\BCISSE\Documents\ecantine\app-mobile

# Arrêtez l'expo (Ctrl+C si c'est en cours)

# Redémarrez
npm start
```

Appuyez sur **`s`** pour forcer un rechargement complet.

---

### **Étape 6: Tester dans l'App**

1. ✅ Connectez-vous en tant qu'acheteur
2. ✅ Ajoutez un produit au panier
3. ✅ Allez à "Panier"
4. ✅ Sélectionnez un mode de paiement (Wave ou Orange Money)
5. ✅ **Entrez votre numéro de téléphone**
6. ✅ Cliquez "Confirmer la commande"

**Résultats:**

- ✅ **Succès**: Vous êtes redirigé vers Wave/Orange Money
- ❌ **Erreur 400**: Vérifiez la console (voir étape 7)

---

### **Étape 7: Diagnostic - Lire les Logs**

Si vous avez toujours l'erreur 400:

#### **Option A: Avec Expo Go**

1. Ouvrez l'app Expo Go
2. Tapez sur la cloche (notifications)
3. Cherchez les logs qui commencent par `[OrderService]`
4. Copiez le message d'erreur complet

#### **Option B: Avec Chrome DevTools**

1. Ouvrez Chrome
2. Allez à: `chrome://inspect`
3. Cliquez sur "Inspect" pour votre app
4. Allez à l'onglet **"Console"**
5. Refaites l'action (checkout)
6. Cherchez les lignes qui commencent par `[OrderService]`
7. Copiez TOUT le message

**Exemple de bon log:**

```
[OrderService] Payload envoyé au RPC: [
  {
    "vendor_id": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "product_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "quantite": 1
      }
    ]
  }
]
[OrderService] Mode paiement: wave
[OrderService] Réponse RPC: [{"id": "..."}]
```

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### Checklist Finale

- [ ] SQL exécuté entièrement sur Supabase (pas d'erreurs)
- [ ] Résultat du diagnostic montre la fonction existe
- [ ] Test direct du RPC fonctionne dans Supabase
- [ ] App redémarrée (npm start)
- [ ] Console logs affichent le payload complet
- [ ] Vous êtes authentifié (le profil s'affiche dans HomeScreen)
- [ ] Le panier contient des produits réels
- [ ] Vous avez entré un numéro de téléphone

### Informations à Me Donner

Si ça échoue, envoyez-moi:

1. **Le message d'erreur exact** des logs
2. **Le payload** envoyé (copié des logs)
3. **La réponse** du serveur (si visible)
4. **Vérification**: La fonction existe dans Supabase SQL Editor?

---

## 📋 Résumé Rapide

| Étape | Action                 | Résultat            |
| ----- | ---------------------- | ------------------- |
| 1     | Copier le SQL complet  | ✅ Pas d'erreur SQL |
| 2     | Exécuter sur Supabase  | ✅ "Query executed" |
| 3     | Tester RPC directement | ✅ Retourne IDs     |
| 4     | Redémarrer app         | ✅ App relancée     |
| 5     | Tester checkout        | ✅ Redirection Wave |

---

## 🎉 Succès!

Une fois que ça marche:

- La commande est créée dans la table `orders`
- L'utilisateur est redirigé vers Wave/Orange Money
- Le cart se vide
- On peut voir la commande dans "Mes commandes"
