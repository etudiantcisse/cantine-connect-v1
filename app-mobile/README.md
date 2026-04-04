# Application Mobile React Native - Cantine Connecte

Ce projet est migre vers React Native avec un backend Supabase.

## Migration effectuee

- Frontend principal: React Native (Expo)
- Backend: Supabase (Auth + Postgres + RLS)

## Prerequis

- Node.js 20+
- npm 10+
- Android Studio (ou appareil Android)
- Compte Supabase

## Installation

1. Configurer Supabase

- Creer un projet Supabase
- Ouvrir SQL Editor
- Executer le script dans supabase/schema.sql

2. Configurer les variables d'environnement

```bash
copy .env.example .env
```

Modifier le fichier .env:

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

3. Installer et lancer

```bash
npm install
npm run android
```

Pour lancer le serveur Expo uniquement:

```bash
npm run start
# ou, si cache Metro a nettoyer
npm run start:clear
```

## Structure active

```
.
├── App.js
├── src/
│   ├── components/
│   ├── constants/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   └── utils/
├── supabase/
│   └── schema.sql
└── .env.example
```

## Fonctionnalites livrees

- Inscription et connexion via Supabase Auth
- Creation/lecture du profil utilisateur
- Liste des produits depuis Supabase
- Filtrage et recherche de produits
- Panier multi-produits (quantites, suppression, checkout)
- Checkout multi-vendeurs (generation de sous-commandes par cantine)
- Consultation des commandes utilisateur
- Annulation de commande en attente
- Dashboard vendeur: creation produit, disponibilite, suivi commandes
- Dashboard vendeur: changement des statuts (preparation, prete, livree, annulee)

## Notes importantes

- Les policies RLS sont activees dans le schema Supabase.
- L'application attend les tables suivantes: profiles, vendors, products, orders, order_items.
- Le fichier supabase/schema.sql contient des fonctions SQL critiques:
  - create_order_with_item
  - create_orders_from_cart
- Pour tester les commandes, il faut au moins un vendeur et des produits en base.

## Prochaines etapes recommandees

1. Ajouter un ecran vendeur pour gerer produits et commandes.
2. Ajouter une vraie gestion du panier multi-produits.
3. Ajouter tests E2E (Detox) et tests unitaires.
