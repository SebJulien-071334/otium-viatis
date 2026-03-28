# ROADMAP — Otium Viatis PWA

## Dev Setup
- [x] ngrok tunnel HTTPS → localhost:3000 — smartphone géoloc + temps réel TAM OK
- [x] PC : `http://localhost:3000` (vercel dev) · Smartphone : URL ngrok

## Phase 1 — Fondations ✅
- [x] Init projet Vite + React + TypeScript
- [x] Config vite-plugin-pwa (Workbox, manifest)
- [x] Config Vercel (vercel.json)
- [x] Vercel Function `/api/navitia.ts` — proxy Navitia (conservé, remplacé par GTFS local)
- [x] Vercel Function `/api/realtime.ts` — proxy CSV TAM (actif)
- [x] `src/lib/tam-colors.ts` — couleurs officielles lignes
- [x] Types Navitia + types internes journey.ts
- [x] `.env.example` + `.gitignore`

## Phase 2 — Données & Logique ✅
- [x] `useJourney.ts` — calcul itinéraire local GTFS (remplace useNavitia)
- [x] `useStopSearch.ts` — recherche arrêts locale insensible aux accents
- [x] `useRealtime.ts` — polling CSV TAM 30s, parsing `;`, filtre stopName, top 3
- [x] `useGeolocation.ts` — GPS navigator.geolocation, messages d'erreur FR
- [x] `smart-departure.ts` — findNearestStations() Haversine
- [x] `gtfs-parser.ts` — parsing stops.txt GTFS
- [x] `useFavorites.ts` — CRUD favoris (Zustand + localStorage)
- [x] `scripts/build-network.mjs` — génère network.json (5 lignes, 108 arrêts)
- [x] `src/lib/itinerary.ts` — moteur routage (direct + 1 correspondance + 2 correspondances)
- [x] `src/data/network.json` — réseau tram compilé

## Phase 3 — Interface ✅
- [x] `StationPicker.tsx` — recherche arrêts locale, GPS, click-outside
- [x] `AddressSearch.tsx` — autocomplete BAN (composant existant)
- [x] `LineBadge.tsx` — badge coloré ligne TAM
- [x] `JourneyTimeline.tsx` — timeline LocalJourney (lignes, arrêts, durée)
- [x] `FavoriteCard.tsx` — carte trajet favori tap-to-go
- [x] Page `Home.tsx` — départ/arrivée/GPS, swap, favoris rapides
- [x] Page `Journey.tsx` — résultats GTFS, temps réel CSV, save favori
- [x] Page `Favorites.tsx` — liste vide/pleine, tap-to-go

## Phase 3.5 — Améliorations recherche ✅
- [x] Brancher `AddressSearch` (BAN) dans `StationPicker` — recherche adresse + arrêt
- [x] Depuis une adresse BAN → trouver l'arrêt tram le plus proche (Haversine)
- [x] `StationPicker` refactorisé — choix de mode "Nom de station" / "Adresse" (plus de mélange)
- [x] `useStopSearch` — normalisation étendue : tirets, apostrophes, abréviations `st`/`ste` → `saint`/`sainte`
- [x] `StationPicker` — option "Ma position" (GPS → station la plus proche en 1 tap)
- [x] `build-network.mjs` — sélection trip le plus long par direction (fix EcoPôle + 3 stations L3 manquantes)
- [x] `itinerary.ts` — 1 seul résultat retourné (le plus rapide), fix ligne circulaire L4
- [x] `build-network.mjs` — intégration `transfers.txt` GTFS → 26 footpaths piétons tram dans `network.json`
- [x] `itinerary.ts` — tri Pareto multi-objectif (temps + correspondances + hub priority)
- [x] `itinerary.ts` — footpaths GTFS dans recherche 1 correspondance (ex: Gare Saint-Roch ↔ Gare Saint-Roch - République)
- [x] `StationPicker.tsx` — badges lignes dans dropdown ET dans champ sélectionné

## Phase 3.6 — Smart itinéraire & UI ✅
- [x] `itinerary.ts` — `findAllCandidates()` retourne tous les candidats pour scoring temps réel
- [x] `itinerary.ts` — `haversineMeters()` + `walkMinutes()` — marche réelle × 1.3 tortuosité / 5km/h
- [x] `useJourney.ts` — scoring temps réel CSV : vraie attente + vraie marche à chaque arrêt candidat
- [x] `useJourney.ts` — seuil 5 min : ne change de candidat que si gain ≥ 5 min
- [x] `JourneyTimeline.tsx` — redesign vertical moderne : départ/arrivée, barre colorée, nb arrêts
- [x] `WalkIndicator.tsx` — indicateur marche 2 personnages style feu piéton (walk/run SVG Phosphor)
- [x] `RealtimePanel` — hiérarchie visuelle prochains passages : 1er mis en avant, 2ème/3ème estompés
- [x] `StationPicker.tsx` — icônes SVG tram/carte/GPS dans dropdown, `translate="no"` anti-traduction navigateur
- [x] Animation blocs départ/arrivée — effet cartes profondeur 3D (perspective 1200px, rotateY, swap interactif tap, reset auto)
- [x] `Home.tsx` — glow pulse TAM bleu sur carte avant (2400ms, ~25 bpm, jamais éteint)
- [x] `StationPicker.tsx` — icône départ/arrivée (logout.svg, rotation 180° pour arrivée), labels plus visibles

## Phase 4 — UX & PWA
- [x] Design light theme appliqué (Roboto, fond #F5F7FA, lisibilité plein soleil, couleurs TAM conservées)
- [ ] Règle des 3 clics validée sur les 3 scénarios (test mobile)
- [ ] Offline : cache stations + favoris fonctionnel (Workbox)
- [ ] Installable : manifest + service worker validés (Lighthouse)
- [x] Gestion erreurs : GPS refusé, pas de trajet trouvé
- [ ] Accessibilité : contrastes couleurs TAM vérifiés WCAG AA
- [ ] Icônes PWA : créer `public/icons/icon-192.png` + `icon-512.png`
- [x] Dialog consentement géoloc au lancement (`App.tsx`) + bouton GPS on/off dans header
- [x] Temps de marche réel OpenRouteService : `api/walking.ts` + `useWalkingTime.ts` — 490m / 6 min validé Playwright (≈ Google Maps)

## Phase 4.5 — Tests avant déploiement
- [x] Tests unitaires itinéraire — couverture 107 stations, bug L4 circulaire corrigé
- [ ] Tests de contrat `network.json` — lat/lon valides, 2 directions par ligne, couleurs bien formées
- [ ] Tests intégration `/api/realtime.ts` — parsing CSV TAM, gestion CSV vide/malformé
- [ ] Tests E2E Playwright — scénario complet : saisie A→B, calcul, affichage itinéraire (règle des 3 clics)

## Phase 5 — Deploy
- [ ] Deploy production `vercel --prod`
- [ ] Test PWA installable sur mobile (iOS Safari + Android Chrome)
- [ ] Lighthouse score PWA ≥ 90

## Backlog (post-MVP)
- [ ] Notifications push "ton tram dans 2 min"
- [ ] Widget temps réel station favorite (Android)
- [ ] Mode accessibilité (PMR) — filtre arrêts `wheelchair_boarding=1`
- [ ] Historique trajets récents
- [ ] Mise à jour automatique network.json (cron GTFS)
- [ ] Support lignes de bus TAM (actuellement tram uniquement)
