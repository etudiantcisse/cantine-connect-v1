-- Clean Orders System - Réécriture complète et propre
-- Exécuter dans Supabase SQL Editor (comme admin)

-- ============================================================
-- 1. VÉRIFIER & NETTOYER LES POLICIES RLS
-- ============================================================

-- Désactiver temporairement pour réécrire proprement
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Orders read own" ON public.orders;
DROP POLICY IF EXISTS "Orders create own" ON public.orders;
DROP POLICY IF EXISTS "Orders cancel own waiting" ON public.orders;
DROP POLICY IF EXISTS "Orders vendor status update" ON public.orders;
DROP POLICY IF EXISTS "Orders read vendor orders" ON public.orders;
DROP POLICY IF EXISTS "Order items read owner or vendor" ON public.order_items;
DROP POLICY IF EXISTS "Order items insert by order owner" ON public.order_items;

-- ============================================================
-- 2. NETTOYER LES ANCIENNES FONCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS public.create_orders_from_cart(jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_order_with_item(uuid, integer, text) CASCADE;

-- ============================================================
-- 3. CRÉER LA NOUVELLE FONCTION ROBUSTE
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_orders_from_cart(
  p_items jsonb,
  p_mode_paiement text DEFAULT 'cash'
)
RETURNS TABLE (
  order_id uuid,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
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
  -- 1. Authentification stricte
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- 2. Vérifier que le profile existe
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Profil utilisateur non trouvé';
  END IF;

  -- 3. Valider le panier
  IF p_items IS NULL 
    OR jsonb_typeof(p_items) <> 'array' 
    OR jsonb_array_length(p_items) = 0 
  THEN
    RAISE EXCEPTION 'Panier vide ou invalide';
  END IF;

  -- 4. Valider le mode de paiement
  IF p_mode_paiement NOT IN ('cash', 'wave', 'orange_money') THEN
    RAISE EXCEPTION 'Mode de paiement invalide: %', p_mode_paiement;
  END IF;

  -- 5. Traiter chaque groupe de produits (par vendeur)
  FOR v_group IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_vendor_id := (v_group ->> 'vendor_id')::uuid;
    v_total := 0;

    -- Vérifier que le vendeur existe
    IF v_vendor_id IS NULL THEN
      RAISE EXCEPTION 'Vendeur manquant dans le panier';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.vendors WHERE id = v_vendor_id
    ) THEN
      RAISE EXCEPTION 'Vendeur introuvable: %', v_vendor_id;
    END IF;

    -- 6. Calculer le total et valider les produits
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_group -> 'items')
    LOOP
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantite := COALESCE((v_item ->> 'quantite')::integer, 0);

      -- Valider quantité
      IF v_quantite <= 0 THEN
        RAISE EXCEPTION 'Quantité invalide pour le produit: %', v_product_id;
      END IF;

      -- Récupérer le prix du produit
      SELECT prix
      INTO v_prix
      FROM public.products
      WHERE id = v_product_id
        AND vendor_id = v_vendor_id
        AND is_available = true;

      -- Vérifier que le produit existe et est disponible
      IF v_prix IS NULL THEN
        RAISE EXCEPTION 'Produit introuvable ou indisponible: %', v_product_id;
      END IF;

      v_total := v_total + (v_prix * v_quantite);
    END LOOP;

    -- 7. Calculer les frais
    v_platform_fee := ROUND(v_total * 0.05, 2);
    v_vendor_amount := v_total - v_platform_fee;
    v_payment_reference := NULL;

    -- 8. Générer la référence de paiement si nécessaire
    IF p_mode_paiement IN ('wave', 'orange_money') THEN
      v_payment_reference := 
        UPPER(p_mode_paiement)
        || '-'
        || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')
        || '-'
        || SUBSTR(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text), 1, 6);
    END IF;

    -- 9. CRÉER LA COMMANDE
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
      v_user_id,
      v_vendor_id,
      v_total,
      p_mode_paiement,
      'en_attente',
      'pending',
      v_payment_reference,
      v_platform_fee,
      v_vendor_amount
    )
    RETURNING id INTO v_order_id;

    -- 10. Créer les items de la commande
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_group -> 'items')
    LOOP
      INSERT INTO public.order_items (
        order_id,
        product_id,
        quantite
      )
      VALUES (
        v_order_id,
        (v_item ->> 'product_id')::uuid,
        (v_item ->> 'quantite')::integer
      );
    END LOOP;

    -- Retourner l'ID de la commande créée
    order_id := v_order_id;
    error_message := NULL;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- ============================================================
-- 4. PERMISSIONS SUR LA FONCTION
-- ============================================================

REVOKE ALL ON FUNCTION public.create_orders_from_cart(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_orders_from_cart(jsonb, text) TO authenticated;

-- ============================================================
-- 5. RÉACTIVER RLS AVEC POLICIES CORRECTES
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Utilisateur voit TOUTES ses propres commandes
CREATE POLICY "users_read_own_orders" ON public.orders
FOR SELECT
USING (user_id = auth.uid());

-- Policy 2: Utilisateur peut créer ses propres commandes (via RPC)
CREATE POLICY "users_create_own_orders" ON public.orders
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy 3: Utilisateur peut modifier ses commandes en attente
CREATE POLICY "users_update_pending_orders" ON public.orders
FOR UPDATE
USING (user_id = auth.uid() AND status = 'en_attente')
WITH CHECK (user_id = auth.uid() AND status = 'en_attente');

-- Policy 4: Vendeur voit les commandes de son magasin
CREATE POLICY "vendors_read_own_orders" ON public.orders
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE profile_id = auth.uid()
  )
);

-- Policy 5: Vendeur peut mettre à jour le statut de ses commandes
CREATE POLICY "vendors_update_order_status" ON public.orders
FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE profile_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE profile_id = auth.uid()
  )
);

-- Policy pour order_items: Lire si on est client ou vendeur de la commande
CREATE POLICY "read_order_items" ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR o.vendor_id IN (
          SELECT id FROM public.vendors 
          WHERE profile_id = auth.uid()
        )
      )
  )
);

-- Policy pour order_items: Créer si on est le client
CREATE POLICY "create_order_items" ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
  )
);

-- ============================================================
-- 6. VÉRIFICATION FINALE
-- ============================================================

-- Afficher le résumé
SELECT 
  'Fonction create_orders_from_cart' as item,
  'Créée' as status
UNION ALL
SELECT 
  'RLS sur orders',
  CASE WHEN (
    SELECT relrowsecurity FROM pg_class 
    WHERE relname = 'orders'
  ) THEN 'Activée' ELSE 'Désactivée' END
UNION ALL
SELECT 
  'Policies sur orders',
  (
    SELECT COUNT(*)::text || ' policies' 
    FROM pg_policies 
    WHERE tablename = 'orders'
  );

-- ============================================================
-- 7. TEST (OPTIONNEL - À COMMENTER EN PROD)
-- ============================================================

-- Voir les policies
-- SELECT schemaname, tablename, policyname, qual
-- FROM pg_policies
-- WHERE tablename IN ('orders', 'order_items')
-- ORDER BY tablename, policyname;
