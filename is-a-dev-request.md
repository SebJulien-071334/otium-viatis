# is-a-dev — Guide de demande de sous-domaine

Référence pour soumettre une demande propre sur [is-a-dev/register](https://github.com/is-a-dev/register).

**Sous-domaine visé : `otium-tram.is-a.dev` → `otium-viatis.vercel.app`**

> ~~PR #35500 fermée le 2026-04-01~~ — raison : template PR supprimé au lieu d'être rempli.
> **PR #35641 soumise le 2026-04-02 — en attente de review. Annonce postée dans #pull-requests Discord.**

---

## Étape 1 — Fichier JSON à créer dans `domains/`

Nom du fichier : `otium-tram.json`

```json
{
  "owner": {
    "username": "SebJulien-071334",
    "email": "sebastienjulien@gmx.fr"
  },
  "records": {
    "CNAME": "otium-viatis.vercel.app"
  }
}
```

> `records` (pluriel) — le CI échoue avec `record` (singulier).

---

## Étape 2 — Corps de la PR (copier-coller EXACT)

**NE PAS supprimer le template.** Garder tous les titres `# Requirements` et `# Website Preview`.

```
- [x] I **agree** to the [Terms of Service](https://is-a.dev/terms).
- [x] My file is following the [domain structure](https://docs.is-a.dev/domain-structure/).
- [x] My website is **reachable** and **completed**.
- [x] My website is **software development** related.
- [x] My website is **not for commercial use**.
- [x] I have provided contact information in the `owner` key.
- [x] I have provided a preview of my website below.

# Website Preview

**Live URL:** https://otium-viatis.vercel.app

![Otium Viatis — Home screen](https://raw.githubusercontent.com/SebJulien-071334/otium-viatis/master/tests/pw/home_prod.png)
```

---

## Étape 3 — Après soumission

- Ne pas ping les mainteneurs dans la PR
- Poster le numéro de PR **une seule fois** dans `#pull-requests` sur leur [Discord](https://discord.gg/is-a-dev) pour accélérer la review
- Délai habituel : quelques heures à 3 jours

---

## Étape 4 — Une fois la PR approuvée (phase MVP Vercel)

1. Vercel → projet → **Settings → Domains**
2. Ajouter `otium-tram.is-a.dev` comme domaine custom
3. Vérifier que `https://otium-tram.is-a.dev` charge bien l'app
4. Cocher la tâche dans `ROADMAP.md`

---

## Phase Pi 5 — migration hébergement (stratégie Cloudflare Tunnel stable)

**Principe :** tunnel Cloudflare nommé dont l'URL `xxx.cfargotunnel.com` est stable et permanente.
is-a-dev n'est mis à jour qu'une seule fois — changer l'hébergement = changer l'origine dans le tunnel uniquement.

**Étapes :**

1. Créer un tunnel Cloudflare nommé sur le Pi 5 → obtenir l'URL stable `xxx.cfargotunnel.com`
2. Soumettre une PR de mise à jour sur is-a-dev/register avec :

```json
{
  "owner": {
    "username": "SebJulien-071334",
    "email": "sebastienjulien@gmx.fr"
  },
  "records": {
    "CNAME": "<tunnel-uuid>.cfargotunnel.com"
  }
}
```

3. Une fois mergée, is-a-dev pointe vers le tunnel Cloudflare
4. Pour changer l'origine (Vercel → Pi 5) : modifier uniquement la config du tunnel — **is-a-dev n'est plus jamais touché**
