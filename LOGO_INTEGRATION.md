# Intégration du Logo et des Assets - Documentation

## 📋 Résumé

Le logo **Cantine Connectée** et le favicon sont maintenant intégrés partout dans l'application (mobile, web, PWA).

## 🎨 Assets Disponibles

### Dans `app-mobile/assets/`:
- **logo.png** - Logo principal (CC avec WiFi/fourchettes) - PNG transparent
- **logo.ico** - Favicon pour le web
- **wave-logo.png** - Logo Wave pour les paiements mobiles
- **Orange-Money-logo.png** - Logo Orange Money pour les paiements mobiles
- **free-money-logo.png** - Logo FREE Money (optionnel)

### Dans `app-mobile/public/`:
Copies des assets pour le déploiement web Netlify:
- `logo.png`, `logo.ico`, `wave-logo.png`, `Orange-Money-logo.png`
- `index.html` - Page HTML avec splash screen du logo
- `manifest.json` - Configuration PWA avec icônes

## ✅ Intégrations Effectuées

### 1. **Configuration Expo (app.json)**
- ✅ `icon` - Logo pour app store (iOS/Android/Web)
- ✅ `favicon` - Favicon web
- ✅ `splash.image` - Image de démarrage
- ✅ `android.adaptiveIcon` - Logo adaptatif Android
- ✅ `ios.icon` - Logo iPhone/iPad
- ✅ `web.favicon` & `web.manifest` - Configuration web

### 2. **Écrans (React Native)**
- ✅ **HomeScreen** - Logo animé au centre (remplace l'icône fourchette)
- ✅ **LoginScreen** - Logo dans la section authentification
- ✅ **SignupScreen** - Logo dans la section création de compte

### 3. **Configuration Web**
- ✅ **public/index.html** - 
  - Favicon `<link rel="icon">` 
  - Apple touch icon pour iOS
  - Splash screen avec logo et animation
  - Meta tags OG pour partage social
  
- ✅ **public/manifest.json** - 
  - Configuration PWA avec icônes multiples
  - Favicon standalone pour installation en tant qu'app

### 4. **Build & Déploiement**
- ✅ **webpack.config.js** - Plugin CopyWebpackPlugin pour copier `public/` vers `dist/`
- ✅ **package.json** - Script `copy:assets` (Node.js) pour copier assets avant build
- ✅ **netlify.toml** - 
  - `copy:assets` dans la commande de build
  - Cache headers pour les assets (1 an pour fichiers versionnés)
  - Redirects pour SPA
  - Headers de sécurité

## 🚀 Scripts Utiles

```bash
# Copier les assets vers public/ (automatique avant build)
npm run copy:assets

# Build web avec assets
npm run build:web

# Build local pour tester
npm run start:web

# Android
npm run android

# iOS
npm run ios
```

## 📱 Plateforme et Affichage du Logo

### Mobile (iOS/Android)
- **App Icon** - Logo.png affiché sur home screen, app store, app switcher
- **Splash Screen** - Logo affiché au démarrage de l'app
- **HomeScreen** - Logo animé au centre avec rotation
- **Auth Screens** - Logo dans cercle de couleur

### Web (Netlify/Desktop)
- **Favicon** - Logo.ico dans onglet navigateur
- **Loading Screen** - Logo avec animation avant chargement React
- **OG Tags** - Logo pour partage social (Facebook, LinkedIn, etc.)
- **Manifest** - Icônes pour "Ajouter à l'écran d'accueil" (PWA)

### PWA (Progressive Web App)
- **Installation** - Icône logo.png sur l'écran d'accueil
- **Standalone** - Logo utilisé pour barres de titre et tiles
- **Manifest** - Configurations pour installation sans navigateur

## 🔄 Flux de Déploiement

```
assets/logo.* 
    ↓
public/ (copié via npm run copy:assets)
    ↓
dist/ (inclus via webpack CopyPlugin)
    ↓
Netlify CDN (publié avec cache headers)
```

## 📌 Notes Importantes

1. **Responsive Images** - Logo.png s'adapte à toutes les tailles d'écran (mobile à desktop)
2. **PWA Ready** - Application peut être installée sur l'écran d'accueil (mobile + desktop)
3. **Branding Cohérent** - Logo utilisé partout pour renforcer l'identité visuelle
4. **Performance** - Cache headers optimisés (assets versionnés = 1 an, HTML = no-cache)
5. **Accessibilité** - Logo avec alt text et descriptions pour lecteurs d'écran

## 🎯 Prochaines Étapes (Optionnel)

- [ ] Ajouter des icônes multiples résolutions pour meilleures pratiques
- [ ] Générer des icônes pour Android Adaptive Icon avec fond
- [ ] Ajouter des screenshots PWA pour meilleure promotion
- [ ] Tester sur tous les appareils (iPhone, Android, Desktop)
- [ ] Configurer les notifications push avec logo
