-- ✅ SCRIPT DE TEST - Copier et exécuter dans Supabase SQL Editor

-- ==================================================================
-- ÉTAPE 1: Vérifier que la fonction existe et est accessible
-- ==================================================================
SELECT 'ÉTAPE 1: Vérifier la fonction' as step;

SELECT 
  routine_name,
  routine_type,
  routine_definition LIKE '%returns table%' as returns_table
FROM information_schema.routines
WHERE routine_name = 'create_orders_from_cart'
  AND routine_schema = 'public';

-- Résultat attendu: 1 ligne avec routine_name = 'create_orders_from_cart'

-- ==================================================================
-- ÉTAPE 2: Récupérer des IDs de test (vendeur et produit réels)
-- ==================================================================
SELECT 'ÉTAPE 2: Récupérer les IDs de test' as step;

WITH vendor_data AS (
  SELECT id as vendor_id, nom_cantine
  FROM public.vendors
  LIMIT 1
),
product_data AS (
  SELECT id as product_id, nom, prix, vendor_id
  FROM public.products
  WHERE is_available = true
  LIMIT 1
)
SELECT 
  v.vendor_id,
  v.nom_cantine,
  p.product_id,
  p.nom as product_name,
  p.prix
FROM vendor_data v
CROSS JOIN product_data p
WHERE p.vendor_id = v.vendor_id;

-- Résultat attendu: vendor_id, product_id, prix (tous des UUIDs/nombres)
-- COPIEZ ces valeurs pour l'étape 3!

-- ==================================================================
-- ÉTAPE 3: Tester le RPC avec un paiement "cash" (simple)
-- ==================================================================
SELECT 'ÉTAPE 3: Tester le RPC avec cash' as step;

-- ⚠️ REMPLACEZ LES VALEURS CI-DESSOUS!
-- Prenez vendor_id et product_id de l'ÉTAPE 2

SELECT * FROM public.create_orders_from_cart(
  '[
    {
      "vendor_id": "550e8400-e29b-41d4-a716-446655440000",
      "items": [
        {
          "product_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          "quantite": 1
        }
      ]
    }
  ]'::jsonb,
  'cash'
);

-- Résultat attendu: Une UUID (ID de la commande créée)

-- ==================================================================
-- ÉTAPE 4: Vérifier que la commande a été créée
-- ==================================================================
SELECT 'ÉTAPE 4: Vérifier la commande' as step;

SELECT 
  id,
  user_id,
  vendor_id,
  total,
  mode_paiement,
  payment_status,
  created_at
FROM public.orders
WHERE payment_status = 'pending'
  AND mode_paiement = 'cash'
ORDER BY created_at DESC
LIMIT 1;

-- Résultat attendu: 1 ligne avec la commande juste créée

-- ==================================================================
-- ÉTAPE 5: Vérifier les items de la commande
-- ==================================================================
SELECT 'ÉTAPE 5: Vérifier les items' as step;

SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.quantite,
  p.nom,
  p.prix
FROM public.order_items oi
JOIN public.products p ON p.id = oi.product_id
WHERE oi.order_id IN (
  SELECT id FROM public.orders
  WHERE payment_status = 'pending'
    AND mode_paiement = 'cash'
  ORDER BY created_at DESC
  LIMIT 1
);

-- Résultat attendu: Au moins 1 ligne avec le produit

-- ==================================================================
-- ÉTAPE 6: Vérifier les permissions du RPC
-- ==================================================================
SELECT 'ÉTAPE 6: Vérifier les permissions' as step;

-- Vérifier qui peut exécuter la fonction
SELECT 
  grantee,
  privilege_type
FROM role_grants
WHERE object_type = 'FUNCTION'
  AND object_name LIKE '%create_orders_from_cart%';

-- Résultat attendu: 'authenticated' et 'anon' doivent avoir 'EXECUTE'

-- ==================================================================
-- ✅ SI TOUTES LES ÉTAPES ONT RÉUSSI
-- ==================================================================
-- La fonction fonctionne! Vous pouvez maintenant:
-- 1. Redémarrer l'app (npm start)
-- 2. Tester le checkout dans l'app
-- 3. Vous devriez être redirigé vers Wave/Orange Money

-- ==================================================================
-- ❌ SI UNE ÉTAPE ÉCHOUE
-- ==================================================================
-- Copiez l'erreur exacte et envoyez-la pour diagnostic
