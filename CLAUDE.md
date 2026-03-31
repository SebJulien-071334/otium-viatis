# CLAUDE.md — Otium Viatis PWA

## Suivi avancement
- `ROADMAP.md` fait foi — cocher `[ ]` → `[x]` dès validation, ajouter ✅ quand phase complète
- Ne jamais attendre la fin de session pour cocher

## Interdictions
- JAMAIS API externe depuis browser sauf BAN (CORS OK)
- JAMAIS carte géographique (Leaflet, Mapbox, Google Maps)
- JAMAIS composant sans typage TypeScript strict
- JAMAIS modifier couleurs officielles lignes TAM
- JAMAIS utiliser Navitia — remplacé par GTFS local

## Algo itinéraire (`src/lib/itinerary.ts`)
- Résultat : 1 seul itinéraire retourné (le meilleur)
- Tri `paretoSort` : si deux itinéraires sont à ≤5 min d'écart → préférer le moins de correspondances
- Sinon : le plus rapide gagne
- Seuil configurable : `TRANSFER_THRESHOLD_MIN = 5`
- `LocalSegment.secondStop` : stop suivant après `fromStop` — fallback temps réel si terminus absent du CSV TAM

## Architecture données
- **Arrêts** : `src/data/network.json` — 110 arrêts tram, côté client
- **Itinéraire** : `src/lib/itinerary.ts` — direct + 1 + 2 correspondances
- **Temps réel** : CSV TAM via `api/realtime.ts` — polling 30s
- **Adresses** : BAN `https://api-adresse.data.gouv.fr/search/` — browser direct, CORS OK
- **Marche** : OpenRouteService `foot-walking` via `api/walking.ts` (clé dans `.env`)
- Navigation : state React dans `App.tsx` — pas de React Router
- Edge Runtime : pas de `fs`, pas de modules `node:` natifs dans `/api/`

## Variables d'environnement
- `OPENROUTESERVICE_API_KEY` dans `.env` — pas `.env.local` (Edge Runtime ne le charge pas en local)

## Commandes
```
vercel dev            # dev complet — Edge Functions + proxy CSV actif (port 3000)
npm run dev           # UI seulement — sans Edge Functions
npm run build-network # régénère network.json depuis GTFS
npm run type-check
npm run test:run
vercel --prod
node scripts/check-realtime-coverage.mjs  # vérifie couverture CSV TAM (110 arrêts)
```

## Test smartphone (ngrok)
- Terminal 1 : `vercel dev` → http://localhost:3000 (UI + Edge Functions)
- Terminal 2 : ngrok tunnel déjà configuré → https://xxxx.ngrok-free.app → localhost:3000
- PC : `http://localhost:3000`
- Smartphone : URL ngrok HTTPS (géoloc + temps réel TAM OK)
- HTTPS requis pour géolocalisation (`navigator.geolocation`)

## Stack
React 18 + TypeScript 5 + Vite 5 + vite-plugin-pwa · TanStack Query v5 · Zustand v4 · Vercel Edge Runtime

## GTFS
Source : `../Pwa-Otium_V/api/Tam/TAM_MMM_GTFS/` → `npm run build-network` → `src/data/network.json`

## Couleurs officielles lignes TAM
```
L1: #005CA9 · L2: #EF7D00 · L3: #C8D400 (text: #000000) · L4: #4B2A0E · L5: #287431
```
Toujours utiliser `getTamColor()` depuis `src/lib/tam-colors.ts` — accepte `"1"` ou `"L1"`

## PWA
- Manifest : `display: standalone`, `theme_color: #0070C0`
- Cache Workbox : stations + favoris uniquement — jamais les horaires temps réel
- Icônes à créer : `public/icons/icon-192.png` + `icon-512.png`

## Infrastructure cible
- Raspberry Pi 5 + Argon V3 + SSD 500Go + Ethernet Cat6 (~936/880 Mbps)
- Post-MVP : migrer Vercel Functions → Express/Fastify sur la Pi

## Fichiers clés
- `src/pages/Home.tsx` — wizard 4 steps, FABs, favoris
- `src/components/StationPicker.tsx` — sélecteur arrêt/adresse/GPS
- `src/lib/itinerary.ts` — algo routage + paretoSort
- `src/data/network.json` — 110 arrêts tram (généré GTFS)
- `api/realtime.ts` — proxy CSV TAM, polling 30s
- `api/walking.ts` — ORS foot-walking
- `src/lib/tam-colors.ts` — couleurs lignes TAM

## Thème & Typographie
- **Palette light** : fond #F5F7FA · surface #FFFFFF · surface-2 #EEF1F6 · texte #1A1F2E · secondaire #6B7280 · accent #00C8FF · alerte #FF4757 · retard #FF6B35
- **Police** : Roboto (Google Fonts, wght 400/600/700)
- **Rationale** : dark theme éclairci insuffisant dehors (soleil) — light theme = lisibilité garantie tram outdoor

## Dépôt Git
- GitHub privé : `https://github.com/SebJulien-071334/otium-viatis`
- Remote : `origin` → HTTPS
- Branche principale : `master`

## Contexte CLI
- `/compact` à 50% contexte utilisé — accord utilisateur avant action
