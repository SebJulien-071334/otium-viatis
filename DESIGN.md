# DESIGN.md — Identité visuelle Otium V

## Concept

**Otium** (latin) — le repos choisi, le temps libre maîtrisé.
L'app est un outil de confiance pour des gens qui connaissent leur réseau. Design sombre, dense, lisible en plein soleil comme en soirée.

Univers visuel : **Cyberpunk SF** — comme un tableau de bord de vaisseau spatial ou d'une cabine de pilotage nocturne. Pas de décoration inutile. Chaque élément a une fonction.

---

## Palette de couleurs

### Fond et surfaces

| Variable              | Valeur    | Usage                              |
|-----------------------|-----------|------------------------------------|
| `--couleur-fond`      | `#0A0E1A` | Fond principal (presque noir-bleu) |
| `--couleur-surface`   | `#141B2D` | Cards, header, résultats           |
| `--couleur-surface-2` | `#1E2A3D` | Éléments internes (passages)       |

### Texte

| Variable                | Valeur    | Usage                        |
|-------------------------|-----------|------------------------------|
| `--couleur-texte`       | `#E2E8F0` | Texte principal              |
| `--couleur-secondaire`  | `#8892A4` | Labels, méta, infos discrètes|

### Accents (UI générique)

| Variable          | Valeur    | Usage                                   |
|-------------------|-----------|-----------------------------------------|
| `--accent-cyan`   | `#00C8FF` | Couleur de ligne par défaut (fallback)  |
| `--accent-violet` | `#8B5CF6` | Réservé (états spéciaux futurs)         |

### Alertes et états

| Variable             | Valeur    | Usage                      |
|----------------------|-----------|----------------------------|
| `--couleur-alerte`   | `#FF4757` | Erreurs, suppressions       |
| `--couleur-retard`   | `#FF6B35` | Données périmées (> 2 min) |

### Couleurs des lignes TAM

| Ligne | Couleur    | Variable dynamique   |
|-------|------------|----------------------|
| L1    | `#005CA9`  | `--couleur-ligne`    |
| L2    | `#EF7D00`  | `--couleur-ligne`    |
| L3    | `#C8D400`  | `--couleur-ligne`    |
| L4    | `#4B2A0E`  | `--couleur-ligne`    |
| L5    | `#287431`  | `--couleur-ligne`    |

La variable `--couleur-ligne` est posée sur `.app` via `style` React et propage la couleur de la ligne sélectionnée à tous les éléments thémés (header border, résultats border, buttons, spinner).

---

## Typographie

### Police principale

**Space Grotesk** — Google Fonts
Chargée via `<link>` dans `index.html` (preconnect inclus).

```css
font-family: 'Space Grotesk', system-ui, sans-serif;
```

| Poids  | Usage                                |
|--------|--------------------------------------|
| 400    | Corps de texte, labels               |
| 600    | Titres de section, noms d'arrêts     |
| 700    | Heures, boutons, badges              |

### Règles typographiques

- **Heures** : `font-variant-numeric: tabular-nums` — alignement colonne garanti
- **Labels** : `text-transform: uppercase` + `letter-spacing: 0.06em` — lisibilité augmentée
- **Taille prochain passage** : `1.7rem` pour le premier horaire (mise en avant visuelle)
- **Taille passages suivants** : `1.3rem`

---

## Logo

**Fichier** : `public/otium-logo.png`
**Source** : logo2.png (skull cyberpunk avec casque SF)
**Taille affichée** : 40px de hauteur, largeur auto

Placé dans le header à gauche du titre `Otium V`.
Le `V` du titre adopte la couleur `--couleur-ligne` (transition 0.25s).

---

## Composants visuels clés

### Boutons de sélection de ligne

5 boutons côte à côte. Couleur propre à chaque ligne via `--couleur-btn-ligne`.

- **État inactif** : bordure colorée, fond transparent, texte coloré
- **État actif** : fond coloré, texte blanc, glow `box-shadow` (12px, 50% opacité)

### Cards favoris

Bordure gauche 3px de la couleur de la ligne (`--couleur-favori`).
Badge ligne arrondi en haut à gauche avec la couleur de fond.

### Résultats / Passages

- Fond `--couleur-surface` + bordure gauche `--couleur-ligne`
- **Premier passage** : fond `color-mix` avec 15% couleur ligne, bordure colorée — fait ressortir l'heure la plus proche
- Passages supprimés : opacité 40% + barré

### Spinner

14×14px, bordure top colorée `--couleur-ligne`, rotation infinie 0.7s.

### Indicateur de données périmées

Quand `Date.now() - derniereMAJ > 2min` :
- Classe `.maj-perimee` → couleur `--couleur-retard` (#FF6B35) + opacité 1
- Préfixe `⚠️` affiché dans le timestamp

---

## Effets et transitions

| Élément           | Propriété          | Durée  |
|-------------------|--------------------|--------|
| Header border     | `border-color`     | 0.25s  |
| Titre V           | `color`            | 0.25s  |
| Boutons ligne     | `background, color, box-shadow` | 0.15s |
| Select focus      | `border-color`     | 0.15s  |
| Cards favoris     | `background`       | 0.15s  |

Pas d'animations décoratifs — uniquement des transitions fonctionnelles.

---

## Mise en page

- **Max-width** : 480px (mobile-first, centré sur desktop)
- **Hauteur min** : `100dvh` (dynamic viewport height — iOS Safari safe)
- **Espacement de base** : `--espacement: 1rem`
- **Rayon de bordure** : `--rayon: 8px`
- **Touch target minimum** : 44px (`min-height: 44px` sur tous les éléments interactifs)

---

## Références d'inspiration

- Interfaces embarquées de vaisseau spatial (Dark SF)
- Tableaux de bord nocturnes (aviation, transport ferroviaire)
- Esthétique "terminal" avec de la couleur contrôlée

**Ne pas faire** : gradients décoratifs, animations d'entrée, icônes superflues, skeuomorphisme.
