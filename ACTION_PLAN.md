# 🎯 RÉSUMÉ - Erreur 400 RPC - Plan d'Action

## Problème

```
POST /rest/v1/rpc/create_orders_from_cart 400 Bad Request
❌ Quand tu cliques "Confirmer la commande", aucune redirection vers Wave
```

---

## Root Cause

Le RPC `create_orders_from_cart` sur Supabase **n'a pas les bonnes permissions** ou **n'existe pas** avec la bonne signature.

---

## ✅ À Faire MAINTENANT

### 1️⃣ **Ouvrir Supabase (2 min)**

- Allez à: https://app.supabase.com
- Sélectionnez: `cantine-connecte`
- Cliquez: `SQL Editor` → `New Query`

### 2️⃣ **Copier le SQL Complet (1 min)**

Ouvrez le fichier:

```
c:\Users\BCISSE\Documents\ecantine\FIX_400_ERROR_COMPLETE_GUIDE.md
```

Copiez le **"Étape 3: Recréer la Fonction"** EN ENTIER

### 3️⃣ **Exécuter le SQL (30 sec)**

- Collez dans Supabase
- Cliquez `Ctrl+Enter` ou `Run`
- Attendez: `Query executed successfully` ✅

### 4️⃣ **Vérifier que ça marche (2 min)**

Ouvrez le fichier:

```
c:\Users\BCISSE\Documents\ecantine\TEST_RPC.sql
```

- Exécutez **"ÉTAPE 1"** → Doit montrer la fonction
- Exécutez **"ÉTAPE 2"** → Doit montrer des IDs réels
- **Remplacez les UUIDs** dans ÉTAPE 3 par ceux de l'ÉTAPE 2
- Exécutez **"ÉTAPE 3"** → Doit retourner une UUID

Si ✅ tout passe → **L'erreur 400 est résolue!**

### 5️⃣ **Redémarrer l'App (1 min)**

```bash
cd C:\Users\BCISSE\Documents\ecantine\app-mobile
npm start
```

Appuyez sur `s` pour recharger

### 6️⃣ **Tester dans l'App (3 min)**

1. Connectez-vous en tant qu'acheteur
2. Ajoutez un produit au panier
3. Allez à "Panier"
4. Sélectionnez "Wave" ou "Orange Money"
5. **Entrez un numéro de téléphone** (ex: 77123456789)
6. Cliquez "Confirmer la commande"

**Résultat attendu:**

- ✅ L'app se vide
- ✅ Vous êtes redirigé vers Wave/Orange Money
- ✅ La commande apparaît dans "Mes commandes"

---

## 📝 Fichiers Modifiés dans le Code

### Code (Javascript)

- ✅ `src/services/ordersService.js` - Ajout de logging pour diagnostic
- ✅ `src/screens/CartScreen.js` - Meilleur affichage des erreurs

### SQL

- ⚠️ `supabase/schema.sql` - Permission RPC modifiée (ligne 549)
  **→ MAIS vous devez exécuter le SQL dans Supabase console!**

### Docs (pour toi)

- 📄 `FIX_400_ERROR_COMPLETE_GUIDE.md` - Guide complet (copie le Étape 3)
- 📄 `TEST_RPC.sql` - Script de test étape par étape
- 📄 `SUPABASE_DEPLOY.md` - Instructions de déploiement
- 📄 `FIXES_SUMMARY.md` - Résumé des corrections précédentes

---

## 🔍 Diagnostic (Si ça échoue)

Si vous avez toujours l'erreur après avoir suivi les étapes:

### Étape A: Vérifier les Logs de l'App

```
Ouvrez: Expo Go → Notifications (cloche) → Cherchez [OrderService]
Ou: Chrome DevTools → Console → Cherchez [OrderService]
Copiez le message d'erreur complet
```

### Étape B: Vérifier Supabase

```sql
-- Copier dans Supabase SQL Editor
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'create_orders_from_cart'
  AND routine_schema = 'public';
```

Résultat attendu: 1 ligne visible ✅
Résultat réel: Aucune ligne → **La fonction n'existe pas!**

### Étape C: Vérifier les Données

```sql
-- Assurez-vous qu'il y a au moins 1 produit disponible
SELECT COUNT(*) FROM public.products WHERE is_available = true;

-- Assurez-vous qu'il y a au moins 1 vendeur
SELECT COUNT(*) FROM public.vendors;
```

---

## ⏱️ Temps Estimé

- **Minimal**: 5-10 min (SQL + test)
- **Avec diagnostic**: 15-20 min
- **Avec correction**: 10-15 min

---

## ❓ Questions Fréquentes

**Q: Je vois "Query executed successfully" mais l'erreur persiste**
A: Redémarrez l'app complètement (arrêtez npm start, relancez)

**Q: Le test RPC fonctionne dans Supabase mais pas dans l'app**
A: Vérifiez que vous êtes authentifié (vérifiez dans HomeScreen)

**Q: Quel numéro de téléphone entrer?**
A: N'importe lequel au format: `77123456789` ou `77 123 45 67`

**Q: Pourquoi l'erreur 400 et pas 403?**
A: 400 = données malformées; 403 = permission denied. On règle les deux avec ce script.

---

## 🎉 Succès = Quand...

- ✅ Test RPC retourne une UUID dans Supabase
- ✅ Checkout dans l'app ne dit pas "400 Bad Request"
- ✅ Vous êtes redirigé vers Wave/Orange Money
- ✅ La commande apparaît dans Supabase → table `orders`
- ✅ Les items apparaissent dans Supabase → table `order_items`

---

## 🆘 Si C'est Toujours Bloqué

Décrivez:

1. Exactement à quelle étape vous êtes bloqué
2. L'erreur exacte que vous voyez
3. Avez-vous exécuté le SQL sur Supabase? (oui/non)
4. Quel est le résultat du test RPC?
