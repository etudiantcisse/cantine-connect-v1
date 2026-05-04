# 📚 Index Complet - Résoudre l'Erreur 400 RPC

## 🚀 START HERE - Les 3 Options

### **Option A: Je veux une solution RAPIDE (5 min)**

👉 Lisez: **[QUICK_FIX.md](QUICK_FIX.md)**

- Instructions copier-coller directes
- Pas besoin de comprendre les détails

---

### **Option B: Je veux comprendre le problème (10-15 min)**

👉 Lisez: **[ACTION_PLAN.md](ACTION_PLAN.md)**

- Vue d'ensemble complète
- Explications du "pourquoi"
- Étapes structurées avec timing

---

### **Option C: Je suis bloqué après avoir essayé (15-30 min)**

👉 Lisez: **[FIX_400_ERROR_COMPLETE_GUIDE.md](FIX_400_ERROR_COMPLETE_GUIDE.md)**

- Guide super détaillé
- Diagnostic profond
- Solutions alternatives

---

## 📖 Tous les Fichiers

| Fichier                             | Contenu                  | Durée  | Quand l'utiliser       |
| ----------------------------------- | ------------------------ | ------ | ---------------------- |
| **QUICK_FIX.md**                    | Code SQL à copier-coller | 5 min  | Besoin rapide          |
| **ACTION_PLAN.md**                  | Plan d'action complet    | 10 min | Comprendre les étapes  |
| **FIX_400_ERROR_COMPLETE_GUIDE.md** | Guide très détaillé      | 20 min | Besoin d'aide          |
| **DEBUG_LOGS.md**                   | Comment lire les erreurs | 10 min | Diagnostic             |
| **TEST_RPC.sql**                    | Script de test           | 5 min  | Vérifier que ça marche |
| **SUPABASE_DEPLOY.md**              | Instructions Supabase    | 5 min  | Référence              |

---

## ✅ Checklist Rapide

### **Avant de Commencer**

- [ ] Avez-vous accès à Supabase? (https://app.supabase.com)
- [ ] Connaissez-vous votre password Supabase?
- [ ] Avez-vous accès à VS Code?
- [ ] L'app React Native est lancée? (npm start)

### **Pendant la Correction**

- [ ] SQL exécuté sans erreur? ✅
- [ ] "Query executed successfully"? ✅
- [ ] Test RPC retourne une UUID? ✅
- [ ] App redémarrée? ✅

### **Après la Correction**

- [ ] Checkout ne dit pas "400 Bad Request"? ✅
- [ ] Redirection vers Wave fonctionne? ✅
- [ ] Commande créée dans Supabase? ✅

---

## 🔧 Modifications du Code

### **Fichiers Modifiés**

1. `src/services/ordersService.js`
   - ✅ Ajout de logging pour diagnostic
   - ✅ Meilleur affichage des erreurs

2. `src/screens/CartScreen.js`
   - ✅ Amélioration des messages d'erreur
   - ✅ Distinction entre erreurs 400 et autres

3. `supabase/schema.sql` (Ligne 549)
   - ✅ Permission RPC modifiée
   - ⚠️ **DOIT être exécuté dans Supabase!**

### **Fichiers NOUVELLEMENT Créés (pour toi)**

- `QUICK_FIX.md` - Solution rapide
- `ACTION_PLAN.md` - Plan structuré
- `FIX_400_ERROR_COMPLETE_GUIDE.md` - Guide complet
- `DEBUG_LOGS.md` - Guide de debugging
- `TEST_RPC.sql` - Script de test
- `SUPABASE_DEPLOY.md` - Instructions déploiement

---

## 🎯 Flux de Correction

```
1. Lis QUICK_FIX.md
    ↓
2. Exécute le SQL sur Supabase
    ↓
3. Attends "Query executed successfully"
    ↓
4. Redémarre l'app
    ↓
5. Teste le checkout
    ↓
    SUCCESS ✅ → Fini!
    ERROR ❌ → Lis DEBUG_LOGS.md

Si toujours bloqué → Lis FIX_400_ERROR_COMPLETE_GUIDE.md
```

---

## 📊 État Actuel

### ❌ Problème

```
POST /rest/v1/rpc/create_orders_from_cart 400 Bad Request
```

### ✅ Solution

```
Exécuter le SQL qui donne les bonnes permissions au RPC
Redémarrer l'app
Tester le checkout
```

### 📈 Étapes Complétées

- ✅ Identifié le problème (permission RPC)
- ✅ Modifié le code pour meilleur diagnostique
- ✅ Créé guides d'installation
- ✅ Créé scripts de test

### ⏳ À Faire

- ⏳ Exécuter le SQL sur Supabase (TOI)
- ⏳ Redémarrer l'app (TOI)
- ⏳ Tester le checkout (TOI)

---

## 💡 Conseils

### Si Vous Êtes Bloqué

1. **Premiers pas**: QUICK_FIX.md
2. **Besoin de contexte**: ACTION_PLAN.md
3. **Toujours bloqué**: FIX_400_ERROR_COMPLETE_GUIDE.md
4. **Problème de debug**: DEBUG_LOGS.md

### Si C'est Urgent

1. Ouvrez QUICK_FIX.md
2. Suivez les instructions "copier-coller"
3. Exécutez dans Supabase
4. Voilà!

### Si Ça Échoue

1. Vérifiez que le SQL a été exécuté (pas d'erreur)
2. Vérifiez que vous êtes authentifié dans l'app
3. Vérifiez que le panier a des produits réels
4. Lisez DEBUG_LOGS.md pour comprendre l'erreur

---

## 🆘 Questions Fréquentes

**Q: Par où commencer?**
A: Fichier **QUICK_FIX.md**

**Q: Ça va prendre combien de temps?**
A: 5-15 minutes maximum

**Q: Pourquoi l'erreur 400?**
A: RPC sans permissions. Solution = exécuter SQL

**Q: Où exécuter le SQL?**
A: https://app.supabase.com → SQL Editor

**Q: Comment savoir si ça a marché?**
A: Test RPC retourne une UUID (pas une erreur)

---

## 📞 Si Besoin d'Aide

Fournissez:

1. ✅ Avez-vous exécuté le SQL? (oui/non)
2. ✅ Erreur exacte dans la console
3. ✅ Résultat du test RPC dans Supabase
4. ✅ Capture d'écran de l'erreur

---

## 🎉 Succès = Quand

- ✅ `Query executed successfully` dans Supabase
- ✅ Test RPC retourne une UUID
- ✅ Checkout pas d'erreur 400
- ✅ Redirection vers Wave fonctionne
- ✅ Commande dans `orders` table

---

**Prêt à commencer?**
👉 Ouvrez **[QUICK_FIX.md](QUICK_FIX.md)** maintenant!
