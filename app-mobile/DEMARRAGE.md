# DEMARRAGE RAPIDE - REACT NATIVE + SUPABASE

## 1) Configurer Supabase

1. Creer un projet Supabase.
2. Ouvrir SQL Editor.
3. Executer le script `supabase/schema.sql`.

Le script cree les tables et policies RLS suivantes:

- profiles
- vendors
- products
- orders
- order_items

Et les fonctions SQL:

- create_order_with_item
- create_orders_from_cart

## 2) Configurer l'application mobile

```bash
copy .env.example .env
```

Remplir `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

## 3) Installer et lancer

```bash
npm install
npm run start
```

Ensuite:

- Android: touche `a` dans Expo ou `npm run android`
- iOS: touche `i` dans Expo ou `npm run ios` (macOS)

## 4) Flux de test minimum

1. Creer un compte etudiant.
2. Creer un compte vendeur.
3. Ouvrir l'onglet vendeur produits pour creer la cantine automatiquement.
4. Ajouter plusieurs produits vendeur.
5. Cote etudiant, ajouter des produits au panier puis valider.
6. Verifier l'historique et le dashboard vendeur (statuts de commande).

## Commandes utiles

```bash
npm run start
npm run start:clear
npm run android
npm run ios
```

## Depannage rapide

- Erreur "Variables Supabase manquantes": verifier `.env`.
- Erreur RLS sur products/orders: reexecuter `supabase/schema.sql`.
- Aucun produit visible: verifier qu'il existe des produits disponibles.
