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

## Architecture données
- **Arrêts** : `src/data/network.json` — 104 arrêts tram, côté client
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
L1: #0070C0 · L2: #F7901E · L3: #8DC63F · L4: #EE1C25 · L5: #9E1F63 (text: #FFFFFF)
```
Toujours utiliser `getTamColor()` depuis `src/lib/tam-colors.ts` — accepte `"1"` ou `"L1"`

## PWA
- Manifest : `display: standalone`, `theme_color: #0070C0`
- Cache Workbox : stations + favoris uniquement — jamais les horaires temps réel
- Icônes à créer : `public/icons/icon-192.png` + `icon-512.png`

## Infrastructure cible
- Raspberry Pi 5 + Argon V3 + SSD 500Go + Ethernet Cat6 (~936/880 Mbps)
- Post-MVP : migrer Vercel Functions → Express/Fastify sur la Pi

## UX Home — cartes départ/arrivée (`src/pages/Home.tsx`)
- Deux cartes absolues dans un conteneur `PEEK=128px / CARD_H=120px` — `perspective: 1200px`
- Carte avant : `translateY(-8px) scale(1) zIndex:10` — glow pulse TAM bleu 2400ms permanent (les deux cartes)
- Carte arrière : `translateY(PEEK) translateX(30px) scale(0.82) rotateY(-8deg) brightness(0.45) blur(0.4px) zIndex:5` — cliquable
- Swap interactif : `useState(swapped)` — clic sur carte arrière → permute avant/arrière ; `useEffect` reset swapped quand `from` change
- Logique : `departIsBack = swapped ? !fromFilled : fromFilled`
- Largeur cards : `max-w-sm mx-auto` — padding `py-6 px-4` (ratio ≈ nombre d'or px/py)
- Bouton "Calculer l'itinéraire" : fade-in + slide-up quand les deux champs sont remplis
- `StationPicker` : icône `logout.svg` avant label, `iconRotated=true` pour Arrivée (rotation 180°)

## Thème & Typographie
- **Palette light** : fond #F5F7FA · surface #FFFFFF · surface-2 #EEF1F6 · texte #1A1F2E · secondaire #6B7280 · accent #00C8FF · alerte #FF4757 · retard #FF6B35
- **Police** : Roboto (Google Fonts, wght 400/600/700)
- **Rationale** : dark theme éclairci insuffisant dehors (soleil) — light theme = lisibilité garantie tram outdoor

## Contexte CLI
- `/compact` à 50% contexte utilisé — accord utilisateur avant action
