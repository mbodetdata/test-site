# BM Data — Site Jekyll

Site officiel de BM Data, consultant data pour TPE/PME, basé à Agen (Lot-et-Garonne).

---

## Arborescence

```
bmdata.fr/
├── _config.yml              ← Configuration Jekyll principale
├── Gemfile                  ← Dépendances Ruby
├── robots.txt               ← Directives pour les robots
├── manifest.json            ← PWA manifest
├── index.html               ← Page d'accueil
├── 404.html                 ← Page erreur 404
│
├── _layouts/
│   ├── default.html         ← Layout de base (head + header + footer)
│   ├── home.html            ← Layout page d'accueil
│   ├── page.html            ← Layout pages standard
│   └── post.html            ← Layout articles de blog
│
├── _includes/
│   ├── head.html            ← Balises <head>, SEO, meta
│   ├── header.html          ← Navigation principale
│   ├── footer.html          ← Pied de page
│   ├── schema.html          ← JSON-LD Schema.org
│   ├── components/
│   │   ├── service-card.html
│   │   ├── realisation-card.html
│   │   ├── testimonial-card.html
│   │   ├── post-card.html
│   │   └── cta-section.html
│   └── icons/
│       └── service-icon.html
│
├── _data/                   ← Toutes les données éditoriales (JSON)
│   ├── global.json          ← Coordonnées, CTA globaux, réseaux sociaux
│   ├── navigation.json      ← Menus navigation et footer
│   ├── home.json            ← Contenu page d'accueil
│   ├── services.json        ← Contenu page services
│   ├── realisations.json    ← Projets réalisés
│   ├── about.json           ← Contenu page à propos
│   ├── temoignages.json     ← Témoignages clients
│   ├── faq.json             ← Questions/réponses
│   └── contact.json         ← Infos et formulaire contact
│
├── _posts/                  ← Articles de blog (Markdown)
│   ├── 2024-10-15-pourquoi-vos-donnees-sont-votre-meilleur-atout.md
│   ├── 2024-11-08-tableau-de-bord-comment-piloter-son-activite.md
│   ├── 2024-12-03-excel-vs-power-bi-lequel-choisir.md
│   ├── 2025-01-20-automatiser-ses-reportings-guide-pratique.md
│   └── 2025-02-18-rgpd-donnees-clients-guide-pme.md
│
├── pages/
│   ├── services.html
│   ├── realisations.html
│   ├── a-propos.html
│   ├── contact.html
│   ├── temoignages.html
│   ├── faq.html
│   ├── blog.html
│   ├── mentions-legales.html
│   └── politique-de-confidentialite.html
│
└── assets/
    ├── css/
    │   └── main.css         ← Design system complet
    ├── js/
    │   └── main.js          ← JavaScript (menu, FAQ, filtres, formulaire)
    └── images/              ← À alimenter avec vos images réelles
        ├── logo-bmdata.svg
        ├── favicon.svg
        ├── og-bmdata.jpg
        ├── martial-bodet-consultant-data-agen.jpg
        ├── blog/
        └── realisations/
```

---

## Lancer le site en local

### Prérequis
- Ruby 3.x
- Bundler (`gem install bundler`)

### Installation
```bash
bundle install
```

### Démarrage
```bash
bundle exec jekyll serve --livereload
```
→ Site accessible sur `http://localhost:4000`

---

## Déploiement sur GitHub Pages

1. Créer un repository GitHub nommé `bmdata.fr` (ou nom de votre choix)
2. Pousser le code sur la branche `main`
3. Dans les Settings GitHub > Pages > Source : sélectionner `main`
4. Configurer le domaine personnalisé `bmdata.fr` dans les settings

---

## Modifier les contenus

### ✏️ Modifier les textes et données

Tous les contenus éditoriaux sont dans `_data/`. Chaque page a son fichier JSON :

| Page | Fichier à modifier |
|------|-------------------|
| Accueil | `_data/home.json` |
| Services | `_data/services.json` |
| Réalisations | `_data/realisations.json` |
| À propos | `_data/about.json` |
| Témoignages | `_data/temoignages.json` |
| FAQ | `_data/faq.json` |
| Contact | `_data/contact.json` |
| Coordonnées, CTA globaux | `_data/global.json` |
| Menus navigation | `_data/navigation.json` |

### 📝 Ajouter un article de blog

Créer un fichier dans `_posts/` avec le format : `AAAA-MM-JJ-titre-de-larticle.md`

En-tête obligatoire :
```yaml
---
layout: post
title: "Titre de l'article"
description: "Meta description SEO (max 160 caractères)"
date: 2025-03-01
author: "Martial Bodet"
category: "Catégorie"
tags: ["tag1", "tag2"]
read_time: "5 min"
---

Contenu en Markdown...
```

### 🖼️ Ajouter des images

Déposer les images dans `assets/images/` :
- Photo portrait : `assets/images/martial-bodet-consultant-data-agen.jpg`
- Image OG/partage : `assets/images/og-bmdata.jpg` (1200×630 px)
- Images réalisations : `assets/images/realisations/[nom-projet].jpg`
- Images blog : `assets/images/blog/[nom-article].jpg`
- Favicon SVG : `assets/images/favicon.svg`

### ⚙️ Modifier la config de base

Dans `_config.yml` :
- `url` : URL du site en production
- `title`, `description` : nom et description du site
- `author.email`, `author.name` : coordonnées
- `location.phone` : numéro de téléphone

---

## Personnalisation prioritaire

### À compléter en priorité absolue :
1. `_config.yml` → numéro de téléphone réel
2. `_data/global.json` → téléphone, email, LinkedIn
3. `pages/mentions-legales.html` → SIRET, adresse précise
4. `assets/images/` → ajouter les vraies photos (portrait Martial, images projets)
5. `_data/realisations.json` → vérifier/ajuster les données des projets

### À ajuster selon vos préférences :
- Les CTA et appels à l'action (`_data/home.json` → section `cta_section`)
- Les stats de la section hero (`_data/home.json` → section `stats`)
- Le formulaire de contact : ajouter une vraie action (Formspree, Netlify Forms) dans `pages/contact.html`

---

## Formulaire de contact

Le formulaire contact est actuellement en mode démonstration (action="#"). Pour le rendre fonctionnel :

**Option 1 — Formspree (gratuit, simple)**
1. Créer un compte sur formspree.io
2. Créer un formulaire et récupérer l'ID
3. Dans `pages/contact.html`, remplacer `action="#"` par `action="https://formspree.io/f/VOTRE_ID"`

**Option 2 — Netlify Forms (si hébergé sur Netlify)**
1. Ajouter `netlify` comme attribut au `<form>`
2. Netlify gère tout automatiquement

---

## SEO — Points importants

- Chaque page a sa balise `title` et `description` propres
- Schema.org LocalBusiness est implémenté dans `_includes/schema.html`
- Le sitemap est généré automatiquement par le plugin `jekyll-sitemap`
- `robots.txt` est à la racine
- Les URLs sont propres (permalink configuré dans `_config.yml`)

---

## Design

**Palette de couleurs :**
- Bleu nuit : `#0f172a` (fond principal)
- Bleu primaire : `#2563eb` (CTA, liens)
- Or/ambre : `#d97706` (accents, CTA secondaires)
- Blanc/crème : `#ffffff`, `#fafaf9`

**Modifier les couleurs :** dans `assets/css/main.css`, section `:root { --color-... }`

**Polices :** Inter (sans-serif) + Playfair Display (serif pour titres accentués)
