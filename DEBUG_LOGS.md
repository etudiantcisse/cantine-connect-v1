# 🔍 Guide de Debugging - Lire les Logs

## Où Trouver les Logs?

### **Option 1: Expo Go (Sur Téléphone)**

1. Ouvrez l'app **Expo Go**
2. Cherchez votre app dans la liste
3. Ouvrez-la
4. Cliquez la **cloche** (notifications) en haut
5. Cherchez les logs qui commencent par `[OrderService]` ou `[CartScreen]`

### **Option 2: Chrome DevTools (Sur Ordinateur)**

1. Lancez l'app: `npm start`
2. Ouvrez Chrome
3. Allez à: `chrome://inspect`
4. Cliquez **"inspect"** pour votre app
5. Allez à l'onglet **"Console"**
6. Testez le checkout
7. Cherchez les logs

---

## ✅ Logs de Succès

Si tout fonctionne, vous devez voir:

```javascript
// ÉTAPE 1: Préparation du payload
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

// ÉTAPE 2: Mode de paiement
[OrderService] Mode paiement: wave

// ÉTAPE 3: Réponse du serveur
[OrderService] Réponse RPC: [
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
]

// ÉTAPE 4: Navigation
[CartScreen] Navigation vers 'Paiement'
```

**Si vous voyez tout ça:** ✅ **Tout fonctionne!**

---

## ❌ Logs d'Erreur 400

Si vous voyez une erreur 400, vous allez voir:

```javascript
// MAUVAIS: Pas d'accès au RPC
[OrderService] Erreur RPC: {
  "error": "400 Bad Request",
  "message": "POST /rest/v1/rpc/create_orders_from_cart returned 400"
}
[OrderService] Message: POST /rest/v1/rpc/create_orders_from_cart returned 400
[OrderService] Détails: undefined

// Dans CartScreen:
❌ Erreur de paiement
Le serveur a rejeté votre demande. Vérifiez que vous êtes connecté...
```

**Si vous voyez ça:** → Suivez **QUICK_FIX.md**

---

## 🔍 Autres Erreurs Possibles

### Erreur: "Utilisateur non authentifie"

```javascript
[OrderService] Erreur RPC: {
  "message": "Utilisateur non authentifie"
}
```

**Solution:** Connectez-vous d'abord

---

### Erreur: "Panier vide"

```javascript
[OrderService] Erreur RPC: {
  "message": "Panier vide"
}
```

**Solution:** Ajoutez un produit au panier avant de checkout

---

### Erreur: "Produit introuvable ou indisponible"

```javascript
[OrderService] Erreur RPC: {
  "message": "Produit introuvable ou indisponible"
}
```

**Solution:**

- Vérifiez que le produit existe dans Supabase
- Vérifiez que `is_available = true`
- Vérifiez que le produit appartient au vendeur

---

### Erreur: "Vendor manquant"

```javascript
[OrderService] Erreur RPC: {
  "message": "Vendor manquant"
}
```

**Solution:** Vérifiez que le payload contient `vendor_id`

---

## 📊 Analyser le Payload

Si l'erreur est dans le payload, vérifiez:

```javascript
// ✅ BON payload
[
  {
    vendor_id: "550e8400-e29b-41d4-a716-446655440000", // ← UUID
    items: [
      {
        product_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // ← UUID
        quantite: 1, // ← nombre > 0
      },
    ],
  },
][
  // ❌ MAUVAIS payload
  {
    vendor_id: null, // ← NULL! Erreur
    items: [], // ← Vide! Erreur
  }
];
```

---

## 🛠️ Tester avec Console.log

Si vous voulez plus de détails, ouvrez:
`src/services/ordersService.js`

Et modifiez comme ça:

```javascript
const { data, error } = await supabase.rpc("create_orders_from_cart", {
  p_items: payload,
  p_mode_paiement: modePaiement,
});

// AJOUTER:
console.log("Full response:", { data, error });
console.log("Error code:", error?.code);
console.log("Status:", error?.status);
console.log("Details:", error?.details);
```

Puis regardez tous les logs que ça affiche.

---

## 📋 Checklist de Debugging

Avant de me contacter, vérifiez:

- [ ] J'ai exécuté le SQL sur Supabase
- [ ] J'ai redémarré l'app (npm start)
- [ ] J'ai attendu que Metro affiche "Ready"
- [ ] J'ai entré un vrai numéro de téléphone
- [ ] Le panier contient des produits réels
- [ ] Je suis connecté (profile visible dans HomeScreen)
- [ ] J'ai regardé les logs (Expo Go ou Chrome DevTools)
- [ ] J'ai copié le message d'erreur exact

---

## 💡 Tricks de Debugging

### Afficher le Payload en Lisible

Si le JSON est sur une ligne, copiez-le et collez-le ici:
https://jsoncrack.com/

Ça va montrer l'arborescence du JSON facilement.

### Tester le RPC Directement

Allez à Supabase → SQL Editor et testez:

```sql
SELECT * FROM public.create_orders_from_cart(
  '[{"vendor_id":"550e8400-e29b-41d4-a716-446655440000","items":[{"product_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","quantite":1}]}]'::jsonb,
  'cash'
);
```

Si ça retourne une UUID → Le problème n'est PAS la fonction
Si ça retourne une erreur → Le problème EST la fonction

---

## 🆘 Envoyer le Bug Report

Si vous êtes bloqué, envoyez:

1. **Copie exacte de l'erreur** du console.log
2. **Le payload** qui a été envoyé
3. **Le résultat du test RPC** dans Supabase
4. **Une capture d'écran** de l'erreur dans l'app

Exemple:

```
Erreur: [OrderService] Erreur RPC: 400 Bad Request
Payload: [{"vendor_id":"550e8400...", ...}]
Test RPC: ✅ Fonctionne dans Supabase
Screenshot: [voir pièce jointe]
```

---

## ✅ Succès Confirmé Quand:

```
✅ Logs affichent: "Réponse RPC: [{"id":"..."}]"
✅ Pas d'erreur 400 dans les logs
✅ App montre: "Commande confirmée !"
✅ Redirection vers Wave se lance
✅ Commande visible dans Supabase → orders table
```
