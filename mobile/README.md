# 📱 SHEAZ — App mobile (React Native + Expo)

> 1 codebase · iOS + Android · TypeScript strict · Palette SPORT validée

## 🚀 Démarrage

```bash
npm install
npx expo start        # scanner le QR avec Expo Go, ou 'a' (Android) / 'i' (iOS)
```

## 🧪 Scripts

| Commande | Rôle |
|---|---|
| `npm start` | Lancer le dev server Expo |
| `npm run typecheck` | Vérification TypeScript (strict) |
| `npm run lint` | ESLint (config Expo) |
| `npm test` | Tests unitaires (Jest + RN Testing Library) |
| `npx eas build --profile preview` | Build cloud Android/iOS (EAS) |

## 🗂️ Structure

```
mobile/
├── App.tsx                    # Splash Triade animé → navigation
├── app.json                   # Identité, permissions santé, splash
├── eas.json                   # Profils build EAS
├── .github/workflows/ci.yml   # CI : lint + typecheck + tests + EAS preview
└── src/
    ├── theme/                 # Design system tokens (charte SPORT)
    ├── components/            # TriadeLoader, PillarCard, ScreenHeader
    ├── screens/               # Dashboard, Sport, Bien-être, Mental, Récompenses, Premium
    └── navigation/            # Stack + bottom tabs
```

## 🎨 Design system

Tokens dans `src/theme/index.ts` — source de vérité : `05-charte-graphique.md` (palette SPORT validée).

| Token | Hex | Usage |
|---|---|---|
| `sport` | `#FF5A1F` | CTA · pilier Sport · streaks |
| `blue` | `#2E6BFF` | pilier Bien-être · liens |
| `purple` | `#8B5CF6` | pilier Mental · méditations |
| `volt` | `#84CC16` | succès / coches |
| `gold` | `#FFC53D` | récompenses |
| `ink` | `#0E1B2C` | base sombre |

## 🔒 Données de santé (RGPD art. 9)

- Consentement explicite avant toute collecte (écran dédié, révocable)
- Hébergement UE (Supabase région UE), chiffrement TLS 1.3 + au repos
- Aucune donnée santé dans les analytics
- Purge complète & export JSON depuis l'app (S6)

## 🗄️ Base de données

Migrations : [`../supabase/migrations/`](../supabase/migrations/0001_init.sql)
- Schéma complet (13 tables) + RLS : chaque user ne voit que ses données
- Trigger : profil créé automatiquement à l'inscription

## 📐 Conventions

- Branches : `main` (stable) · `develop` (intégration) · `feature/*` (PR requise)
- Version semver · EAS Update pour les hotfix OTA
- Secrets dans GitHub Secrets — jamais dans le code
