---
layout: post
title: "Glossaire data : les termes essentiels pour comprendre Talend, Power BI et les projets BI en entreprise"
description: "Un glossaire data clair et concret pour comprendre les termes utiles en intégration de données, qualité, reporting et Power BI."
categories: blog
tags: [Glossaire Data, Talend, Talaxie, Power BI, ETL, BI, Qualité des données, PME]
image: ""
active: false
parent_category: data
category_label: Glossaire
---

# Introduction — Quand le vocabulaire bloque plus que la technique

Dans beaucoup d’entreprises, les projets data ne coincent pas d’abord sur l’outil.

Ils coincent sur les mots.

On parle d’ETL, d’API, de mapping, de DAX, de source de vérité, de granularité ou de DirectQuery… et tout le monde fait semblant de suivre. Résultat : le besoin est mal cadré, les échanges deviennent flous, et le reporting finit souvent par reposer sur des hypothèses implicites.

Le problème, ce n’est donc pas seulement le jargon.

Le problème, c’est qu’un terme mal compris au départ peut produire un flux mal conçu, une mauvaise jointure, un KPI contesté ou un dashboard qui donne confiance… à tort.

L’objectif de ce glossaire est simple : t’aider à comprendre les termes qui ont **vraiment** du sens dans un projet Talend, Talaxie ou Power BI, sans te noyer dans un dictionnaire de labo.

Ici, on reste sur des mots utiles en entreprise :

- ceux qu’on rencontre dans les flux de données
- ceux qui structurent la qualité et le reporting
- ceux qui reviennent dans les projets BMData autour de Talend, Talaxie, API, EDI et Power BI

> ℹ️ Si tu veux voir comment ces notions s’articulent dans une architecture simple, tu peux aussi lire [Architecture data simple pour PME : structurer un pipeline entre les sources, l’ETL et la BI](/blog/architecture-data-pme/).

---

# Sommaire

- Les fondamentaux à connaître avant de parler outil
- Où les données sont stockées et comment elles se structurent
- Comment les données circulent entre fichiers, APIs et applications
- ETL, pipelines et transformations : là où la donnée devient exploitable
- Qualité de données : le sujet qu’on découvre souvent trop tard
- BI et modélisation : ce qui rend un reporting lisible
- Les termes Power BI vraiment utiles
- Exploitation, sécurité et gouvernance sans jargon
- Conclusion
- À retenir
- Aller plus loin sur BMData
- Sources
- 5 titres alternatifs
- 10 idées de posts LinkedIn à recycler

---

# Les fondamentaux à connaître avant de parler outil

Avant de parler Talend, SQL ou Power BI, il faut déjà comprendre ce qu’on manipule.

## Donnée

Une **donnée** est une valeur brute : une date, un montant, un code client, un statut de commande.

**À quoi ça sert concrètement :** c’est la matière première de tout projet data. Sans données fiables, aucun reporting ne tient debout.

**Exemple en entreprise :** `Commande n°4587`, `Montant = 1290 €`, `Statut = Expédiée`.

**Confusion fréquente :** une donnée n’est pas encore une information utile. Tant qu’elle n’est pas replacée dans un contexte, elle reste brute.

## Source de données

Une **source de données** est l’endroit d’où vient la donnée : ERP, CRM, API, fichier Excel, base SQL, outil métier, plateforme e-commerce.

**À quoi ça sert concrètement :** identifier la source permet de savoir qui produit la donnée, à quelle fréquence, et avec quel niveau de fiabilité.

**Exemple en entreprise :** Salesforce pour les opportunités, un ERP pour la facturation, Shopify pour les commandes, un fichier Excel pour un budget.

**Nuance utile :** une source métier n’est pas forcément une bonne source pour le reporting direct. Elle est souvent faite pour faire tourner l’activité, pas pour analyser proprement.

## Table, colonne, ligne

Ces trois mots reviennent partout, et ils méritent d’être posés proprement.

- **Table** : ensemble structuré de données sur un même sujet.  
  **Exemple :** table `Clients`, table `Commandes`, table `Produits`.

- **Colonne** : un attribut précis dans une table.  
  **Exemple :** `date_commande`, `montant`, `code_client`.

- **Ligne** : un enregistrement individuel dans la table.  
  **Exemple :** une commande précise, un client précis, un ticket précis.

**À quoi ça sert concrètement :** comprendre cette structure évite beaucoup de malentendus dès qu’on parle de requêtes SQL, de jointures ou de modèle Power BI.

**Confusion fréquente :** beaucoup de gens disent “base de données” alors qu’ils parlent en réalité d’une simple table ou d’un export Excel.

## Schéma de données

Le **schéma de données** décrit la structure attendue des données : noms de colonnes, types, longueurs, format, règles de relation.

**À quoi ça sert concrètement :** il sert de contrat technique. Il permet de détecter plus vite une colonne manquante, un type incohérent ou un fichier qui a changé sans prévenir.

**Exemple en entreprise :** une colonne `date_facture` attendue en date, mais livrée en texte dans un nouveau fichier.

**Confusion fréquente :** un schéma n’est pas le contenu. C’est la structure prévue du contenu.

## Clé primaire et clé étrangère

Ces deux notions sont simples sur le principe, mais très utiles pour comprendre pourquoi certains rapports donnent de mauvais résultats.

- **Clé primaire** : identifiant unique d’une ligne dans une table.  
  **Exemple :** `id_client` unique dans la table `Clients`.

- **Clé étrangère** : colonne qui permet de relier une table à une autre.  
  **Exemple :** `id_client` présent dans la table `Commandes` pour rattacher chaque commande à un client.

**À quoi ça sert concrètement :** sans ces clés, les jointures deviennent fragiles, les doublons apparaissent plus facilement, et les relations Power BI peuvent partir de travers.

**Exemple en entreprise :** si deux systèmes n’utilisent pas le même identifiant client, le rapprochement des ventes et de la facturation devient vite approximatif.

**Confusion fréquente :** une clé primaire ne “décrit” pas un client ; elle sert d’abord à l’identifier sans ambiguïté.

## Source de vérité

La **source de vérité** est l’endroit que l’on considère comme la référence la plus fiable pour une information donnée.

**À quoi ça sert concrètement :** elle évite qu’un même indicateur soit calculé différemment selon les équipes.

**Exemple en entreprise :** le chiffre d’affaires peut être pris dans l’ERP comme référence, plutôt que dans plusieurs exports Excel modifiés à la main.

**Confusion fréquente :** il n’existe pas forcément une source de vérité unique pour toute l’entreprise. En pratique, on parle souvent d’une source de vérité **par sujet** : clients, ventes, stocks, tickets, RH.

## Historisation

L’**historisation** consiste à conserver les états successifs d’une donnée dans le temps, au lieu d’écraser la valeur précédente.

**À quoi ça sert concrètement :** elle permet d’expliquer une évolution, de reconstituer une situation passée et d’analyser des changements dans le temps.

**Exemple en entreprise :** suivre l’évolution d’un statut de ticket, du prix d’un produit ou de l’affectation d’un commercial.

**Confusion fréquente :** garder seulement la dernière valeur ne permet pas de faire une vraie analyse temporelle.

## Granularité

La **granularité** désigne le niveau de détail d’un jeu de données.

**À quoi ça sert concrètement :** elle détermine ce que tu peux analyser correctement. Un mauvais niveau de granularité casse vite les KPI.

**Exemple en entreprise :**
- granularité **commande** : une ligne par commande
- granularité **ligne de commande** : une ligne par produit vendu dans la commande
- granularité **jour** : une ligne par date et par indicateur

**Confusion fréquente :** un tableau peut être détaillé visuellement sans que la donnée source ait la bonne granularité.

## Batch et temps réel

Ces deux termes décrivent surtout **quand** les données sont traitées.

- **Batch** : traitement par lots, à intervalles définis.  
  **Exemple :** chargement des ventes toutes les nuits à 2h.

- **Temps réel** : donnée disponible quasi immédiatement après l’événement.  
  **Exemple :** un statut de paiement mis à jour dès validation.

**À quoi ça sert concrètement :** cela permet de cadrer les attentes métier. Tout n’a pas besoin d’être “temps réel”, et tout ne devrait pas l’être juste pour faire moderne.

**Nuance utile :** beaucoup de besoins métier sont très bien couverts par du batch bien conçu.

---

# Où les données sont stockées et comment elles se structurent

Une fois les bases posées, il faut distinguer les outils faits pour **enregistrer**, ceux faits pour **interroger**, et ceux faits pour **analyser**.

## Base de données

Une **base de données** est un système de stockage organisé pour conserver et retrouver des informations de manière fiable.

**À quoi ça sert concrètement :** elle centralise les données et évite de dépendre uniquement de fichiers dispersés.

**Exemple en entreprise :** PostgreSQL, SQL Server ou MySQL pour stocker des clients, commandes, stocks, logs ou référentiels.

**Confusion fréquente :** un classeur Excel n’est pas une base de données, même s’il sert parfois comme tel par désespoir ou habitude.

## SQL et requête

- **SQL** est le langage utilisé pour interroger et manipuler des bases relationnelles.
- Une **requête** est l’instruction que l’on envoie à la base pour lire, filtrer, agréger ou transformer des données.

**À quoi ça sert concrètement :** SQL permet d’aller chercher précisément ce dont on a besoin sans exporter toute la base.

**Exemple en entreprise :** récupérer les commandes du mois, compter les tickets en retard, calculer la marge par famille de produits.

**Confusion fréquente :** SQL n’est pas une base de données ; c’est le langage qui permet de dialoguer avec elle.

## Vue

Une **vue** est une couche logique qui présente les données sous une forme déjà préparée, sans forcément dupliquer physiquement les tables.

**À quoi ça sert concrètement :** elle simplifie l’accès aux données utiles pour le reporting ou l’intégration.

**Exemple en entreprise :** une vue qui regroupe commandes, clients et commerciaux pour alimenter Power BI.

**Confusion fréquente :** une vue peut ressembler à une table, mais ce n’est pas forcément une table stockée.

## Data warehouse et data mart

Ces deux notions reviennent souvent dès qu’on veut fiabiliser la BI.

- **Data warehouse** : stockage central conçu pour consolider des données de plusieurs sources et faciliter l’analyse.
- **Data mart** : sous-ensemble plus ciblé, orienté sur un domaine métier précis.

**À quoi ça sert concrètement :** le data warehouse centralise ; le data mart simplifie l’usage côté métier.

**Exemple en entreprise :**
- data warehouse : toute la donnée consolidée ventes, achats, clients, logistique
- data mart : un périmètre “finance” ou “service client” prêt pour le reporting

**Confusion fréquente :** un data mart n’est pas forcément un projet plus “petit”. C’est surtout un périmètre plus ciblé.

---

# Comment les données circulent entre fichiers, APIs et applications

Dans les projets Talend et Talaxie, une grande partie du travail consiste à faire circuler des données entre des systèmes qui ne parlent pas naturellement le même langage.

## API

Une **API** est une interface qui permet à une application d’échanger des données ou des actions avec une autre de manière structurée.

**À quoi ça sert concrètement :** elle sert à lire, envoyer ou mettre à jour des informations sans passer par des ressaisies manuelles.

**Exemple en entreprise :** récupérer des commandes Shopify, envoyer des clients vers un ERP, lire des tickets depuis un outil support.

**Confusion fréquente :** une API n’est pas “la donnée”. C’est le moyen d’accès à cette donnée.

> ℹ️ Si ce sujet t’intéresse, tu peux compléter avec [API vs Webhook : comprendre la différence et implémenter un webhook sécurisé avec Talaxie](/blog/API-et-Webhook-talaxie-esb/).

## Webhook

Un **webhook** est un mécanisme de notification automatique : au lieu d’aller interroger une API en boucle, tu reçois un appel quand un événement survient.

**À quoi ça sert concrètement :** il permet de déclencher un traitement dès qu’un événement arrive.

**Exemple en entreprise :** un site e-commerce envoie un webhook lorsqu’une commande est validée ou lorsqu’un paiement change d’état.

**Confusion fréquente :** avec une API, c’est souvent toi qui viens chercher l’information ; avec un webhook, c’est l’événement qui vient te prévenir.

## Mapping

Le **mapping** consiste à faire correspondre les champs d’une source avec les champs d’une cible.

**À quoi ça sert concrètement :** il permet de relier correctement des structures différentes entre deux systèmes.

**Exemple en entreprise :** `customer_id` côté e-commerce devient `code_client` côté ERP.

**Confusion fréquente :** un mapping n’est pas un simple copier-coller de colonnes. Il implique souvent des règles métier, des conversions et des exceptions.

## Transformation

Une **transformation** modifie la donnée pour la rendre exploitable dans le système cible ou dans le reporting.

**À quoi ça sert concrètement :** elle homogénéise les formats, recode des valeurs, calcule des champs, nettoie des libellés ou prépare un indicateur.

**Exemple en entreprise :** convertir une date texte en vraie date, recoder `FR` en `France`, calculer une marge.

**Confusion fréquente :** déplacer une donnée n’est pas encore la transformer.

## Flux entrant et flux sortant

- **Flux entrant** : donnée qui arrive dans un système.
- **Flux sortant** : donnée qui en part.

**À quoi ça sert concrètement :** cela permet de décrire clairement le sens du traitement.

**Exemple en entreprise :**
- flux entrant : réception d’un fichier fournisseur
- flux sortant : envoi de données consolidées vers Power BI ou un outil tiers

**Confusion fréquente :** un même système peut avoir des flux entrants et sortants en parallèle.

## Synchronisation

La **synchronisation** vise à maintenir des données cohérentes entre deux systèmes.

**À quoi ça sert concrètement :** elle évite qu’un client, un produit ou un statut diverge selon l’outil consulté.

**Exemple en entreprise :** synchroniser les clients entre un CRM et un ERP, ou les commandes entre une boutique en ligne et la logistique.

**Nuance utile :** synchroniser ne veut pas forcément dire “temps réel”. Une synchronisation nocturne peut suffire selon le besoin.

## FTP et SFTP

Ces protocoles servent à transférer des fichiers entre systèmes.

- **FTP** : protocole historique de transfert de fichiers
- **SFTP** : transfert de fichiers avec une couche de sécurité adaptée aux usages actuels

**À quoi ça sert concrètement :** ils restent très utilisés pour échanger des fichiers CSV, XML, EDI ou logs entre partenaires et applications.

**Exemple en entreprise :** dépôt automatique d’un fichier de commandes sur un serveur partenaire chaque nuit.

**Confusion fréquente :** dire “on a un flux fichier” sans préciser le protocole masque souvent un vrai sujet de sécurité ou d’exploitation.

## CSV

Le **CSV** est un format de fichier texte tabulaire, simple et très répandu.

**À quoi ça sert concrètement :** il sert à échanger des tableaux de données entre outils différents.

**Exemple en entreprise :** un export quotidien des ventes ou un import de catalogue produits.

**Confusion fréquente :** un CSV n’est pas toujours propre ni standardisé de la même manière selon les outils. Le séparateur, l’encodage et les guillemets changent vite le résultat.

## Excel

**Excel** est un outil incontournable en entreprise, souvent utilisé à la fois comme source, comme zone tampon et comme outil d’analyse.

**À quoi ça sert concrètement :** il sert pour des saisies, des rapprochements, des budgets, des listes métiers ou des consolidations rapides.

**Exemple en entreprise :** budget commercial, liste d’objectifs, fichier de reprise, suivi de stock “temporaire” devenu permanent.

**Confusion fréquente :** Excel est très utile, mais ce n’est pas une architecture data.

## JSON

Le **JSON** est un format texte structuré, très utilisé dans les APIs et les échanges applicatifs.

**À quoi ça sert concrètement :** il permet de représenter des objets, des listes et des structures imbriquées.

**Exemple en entreprise :** réponse d’API contenant un client, ses commandes et les lignes associées.

**Confusion fréquente :** du JSON bien formé ne veut pas dire JSON simple à exploiter. Dès que les structures s’imbriquent, le mapping devient plus délicat.

> ℹ️ Si tu manipules beaucoup de JSON avec Talend ou Talaxie, tu peux aussi lire [Talaxie : bien configurer tWriteJSONField et le JSON Tree](/blog/tWriteJSONField/).

## XML

Le **XML** est un format texte structuré, plus verbeux que le JSON, mais encore très présent dans les échanges inter-applicatifs et certains environnements historiques.

**À quoi ça sert concrètement :** il sert souvent dans des flux normés, des exports métiers ou des échanges B2B.

**Exemple en entreprise :** commandes, catalogues, documents techniques ou messages structurés entre applications.

**Confusion fréquente :** XML n’est pas “vieux donc inutile”. Dans certains contextes, il reste parfaitement pertinent.

## EDI

L’**EDI** désigne les échanges de données informatisés entre entreprises selon des formats et règles convenus.

**À quoi ça sert concrètement :** il automatise des échanges B2B sans ressaisie manuelle.

**Exemple en entreprise :** transmission de commandes, avis d’expédition, réceptions ou factures entre un client, un entrepôt et un transporteur.

**Confusion fréquente :** l’EDI n’est pas juste “un fichier qu’on s’envoie”. C’est un cadre d’échange structuré avec des conventions précises.

## PDF structuré et PDF non structuré

Tous les PDFs ne se valent pas pour la data.

- **PDF structuré** : contenu suffisamment organisé pour être extrait plus proprement
- **PDF non structuré** : document pensé pour la lecture humaine, mais difficile à exploiter automatiquement

**À quoi ça sert concrètement :** cette distinction permet d’évaluer si un document peut être intégré sans bricolage excessif.

**Exemple en entreprise :** une facture PDF avec une structure stable est plus exploitable qu’un document visuellement joli mais mal structuré.

**Confusion fréquente :** “c’est dans un PDF” ne veut pas dire “c’est facilement intégrable”.

---

# ETL, pipelines et transformations : là où la donnée devient exploitable

C’est ici qu’on passe d’une donnée dispersée à une donnée exploitable.

## ETL et ELT

Ces deux sigles décrivent deux façons d’enchaîner les mêmes grandes étapes.

- **ETL** : on extrait, on transforme, puis on charge
- **ELT** : on extrait, on charge, puis on transforme dans la cible

**À quoi ça sert concrètement :** cela permet d’organiser un pipeline de manière lisible et maintenable.

**Exemple en entreprise :** récupérer des données d’ERP, les nettoyer et les charger vers une base cible pour Power BI.

**Confusion fréquente :** le vrai sujet n’est pas de réciter le sigle. Le vrai sujet est de ne pas laisser la logique critique vivre en vrac dans le dashboard.

## Pipeline de données

Un **pipeline de données** est la chaîne complète qui fait circuler, transformer, contrôler et charger les données entre la source et la cible.

**À quoi ça sert concrètement :** il rend le traitement reproductible, pilotable et industrialisable.

**Exemple en entreprise :** ERP → extraction → contrôles → base SQL → tables prêtes pour Power BI.

**Confusion fréquente :** un pipeline n’est pas juste un script. C’est un processus complet avec dépendances, erreurs, reprise et exploitation.

## Job

Dans l’univers Talend, un **job** est une unité de traitement qui exécute un flux donné.

**À quoi ça sert concrètement :** il permet d’encapsuler un traitement identifiable, documentable et rejouable.

**Exemple en entreprise :** un job pour charger les commandes, un autre pour réconcilier les paiements, un autre pour alimenter une table de reporting.

**Confusion fréquente :** un job n’est pas forcément un gros traitement. Il peut être très ciblé.

> ℹ️ Pour voir comment les jobs s’intègrent dans des flux concrets, tu peux lire [Talend/Talaxie : comment les entreprises automatisent leurs données sans infrastructure complexe](/blog/utilisation-talend/).

## Orchestration

L’**orchestration** consiste à organiser l’enchaînement des traitements : quel job démarre, dans quel ordre, sous quelles conditions et avec quelles dépendances.

**À quoi ça sert concrètement :** elle évite que les traitements partent dans le désordre ou se lancent alors que les prérequis ne sont pas prêts.

**Exemple en entreprise :** charger les référentiels avant les ventes, puis recalculer les indicateurs, puis notifier le succès ou l’échec.

**Confusion fréquente :** automatiser n’est pas orchestrer. On peut lancer des traitements automatiquement sans que l’enchaînement soit propre.

## Nettoyage de données

Le **nettoyage de données** consiste à corriger ou écarter les valeurs inutilisables.

**À quoi ça sert concrètement :** il réduit les erreurs visibles dans les rapports et améliore la confiance dans les chiffres.

**Exemple en entreprise :** corriger des dates invalides, supprimer des espaces parasites, harmoniser des libellés incohérents.

**Confusion fréquente :** nettoyer la donnée une fois dans Excel ne règle pas le problème à la source.

## Déduplication

La **déduplication** vise à détecter et traiter des enregistrements en double.

**À quoi ça sert concrètement :** elle évite de surévaluer un volume, un portefeuille client ou un stock.

**Exemple en entreprise :** deux clients créés avec le même email mais deux orthographes différentes du nom.

**Confusion fréquente :** un doublon parfait est facile à voir ; les quasi-doublons sont souvent le vrai sujet.

## Jointure

Une **jointure** permet de relier des données issues de plusieurs tables à partir d’une clé commune.

**À quoi ça sert concrètement :** elle sert à reconstituer une vue métier utile à partir de plusieurs sources.

**Exemple en entreprise :** rattacher des commandes à des clients, des tickets à des agents, des paiements à des factures.

**Confusion fréquente :** une mauvaise jointure ne plante pas toujours. Elle peut juste produire de mauvais chiffres, ce qui est plus sournois.

## Agrégation

L’**agrégation** consiste à résumer des données détaillées.

**À quoi ça sert concrètement :** elle permet de passer du niveau transaction au niveau pilotage.

**Exemple en entreprise :** total des ventes par mois, nombre de tickets par équipe, marge par catégorie.

**Confusion fréquente :** agréger trop tôt peut faire perdre un niveau de détail utile pour l’analyse.

## Contrôle de cohérence

Un **contrôle de cohérence** vérifie qu’une donnée respecte des règles attendues.

**À quoi ça sert concrètement :** il bloque ou isole les cas anormaux avant qu’ils ne polluent le reporting.

**Exemple en entreprise :** une date de livraison antérieure à la date de commande, un montant négatif impossible, un code pays non reconnu.

**Confusion fréquente :** un fichier techniquement lisible peut rester métierement incohérent.

## Rejet

Un **rejet** correspond à une donnée isolée parce qu’elle ne respecte pas les règles du traitement.

**À quoi ça sert concrètement :** il permet de ne pas casser tout le flux pour quelques lignes problématiques.

**Exemple en entreprise :** une ligne de commande sans identifiant client, stockée dans un flux de rejet pour correction.

**Confusion fréquente :** rejeter n’est pas perdre la donnée. Bien géré, un rejet améliore la qualité et la traçabilité.

## Reprise sur incident

La **reprise sur incident** désigne la capacité à relancer un traitement proprement après une erreur.

**À quoi ça sert concrètement :** elle évite les doubles chargements, les trous de données ou les corrections manuelles stressantes à 7h42.

**Exemple en entreprise :** relancer uniquement le lot échoué de la nuit au lieu de recharger tout l’historique.

**Confusion fréquente :** “on relance tout” n’est pas une stratégie de reprise. C’est souvent une source d’effets de bord.

---

# Qualité de données : le sujet qu’on découvre souvent trop tard

Un dashboard peut être rapide, beau, interactif… et totalement trompeur si la donnée est mauvaise.

## Qualité de données

La **qualité de données** désigne le niveau de confiance que l’on peut accorder aux données utilisées.

**À quoi ça sert concrètement :** elle conditionne la fiabilité des analyses, des automatisations et des décisions.

**Exemple en entreprise :** si les clients sont mal identifiés ou si des commandes manquent, les KPI commerciaux deviennent discutables.

**Confusion fréquente :** la qualité n’est pas un sujet “après”. Elle commence dès la collecte.

## Doublon

Un **doublon** est un enregistrement présent plusieurs fois, exactement ou presque.

**À quoi ça sert concrètement de le traiter :** éviter de compter deux fois la même réalité métier.

**Exemple en entreprise :** un prospect saisi deux fois dans le CRM ou une facture chargée deux fois après un incident.

**Nuance utile :** tous les doublons ne sont pas strictement identiques. Les plus pénibles sont souvent les presque-doublons.

## Valeur manquante

Une **valeur manquante** est une information absente alors qu’elle est attendue.

**À quoi ça sert concrètement de la détecter :** savoir si un calcul, une jointure ou une analyse risque d’être faussé.

**Exemple en entreprise :** un produit sans famille, une commande sans date, un ticket sans responsable.

**Confusion fréquente :** vide ne veut pas dire “sans importance”. Parfois, c’est précisément la colonne qui porte le sens métier.

## Cohérence

La **cohérence** vérifie que les données restent logiques entre elles.

**À quoi ça sert concrètement :** elle permet d’éviter des contradictions qui sapent la confiance dans les reportings.

**Exemple en entreprise :** une commande marquée “livrée” alors qu’aucune date d’expédition n’existe.

**Confusion fréquente :** une donnée peut être présente et bien formatée, tout en restant incohérente sur le plan métier.

## Fiabilité

La **fiabilité** correspond à la capacité d’une donnée à être utilisée sans provoquer de doute majeur.

**À quoi ça sert concrètement :** c’est ce qui permet aux équipes de prendre une décision sans repasser derrière chaque chiffre.

**Exemple en entreprise :** un KPI de retard utilisé en comité de direction doit être fiable, pas juste “à peu près juste”.

**Nuance utile :** la fiabilité dépend autant des règles de traitement que de la source d’origine.

## Règle de qualité

Une **règle de qualité** définit ce qu’une donnée doit respecter pour être considérée comme acceptable.

**À quoi ça sert concrètement :** elle rend le contrôle explicite au lieu de reposer sur l’intuition d’une seule personne.

**Exemple en entreprise :**
- un email doit avoir un format valide
- un montant ne peut pas être négatif dans tel contexte
- un client actif doit avoir un identifiant unique

**Confusion fréquente :** une règle de qualité n’est pas forcément une règle métier complète, mais les deux se croisent souvent.

> ℹ️ Sur Talaxie, la qualité ne se résume pas à “ça passe ou ça casse”. Tu peux voir un exemple concret dans [Talaxie : sécuriser l’entrée du pipeline avec tSchemaComplianceCheck](/blog/tSchemaComplianceCheck/).

---

# BI et modélisation : ce qui rend un reporting lisible

Le reporting utile ne repose pas seulement sur de jolis visuels. Il repose d’abord sur une structure claire.

## Reporting

Le **reporting** consiste à restituer des données et indicateurs pour suivre une activité.

**À quoi ça sert concrètement :** il permet de suivre une situation, d’identifier des écarts et d’alimenter le pilotage.

**Exemple en entreprise :** ventes du mois, taux de service, backlog, retard de livraison, marge.

**Confusion fréquente :** un reporting n’est pas automatiquement un bon outil d’aide à la décision. Il peut aussi noyer l’utilisateur sous les chiffres.

## Tableau de bord

Un **tableau de bord** est une interface de pilotage qui met en avant les indicateurs les plus utiles pour agir.

**À quoi ça sert concrètement :** il synthétise l’essentiel pour un rôle donné.

**Exemple en entreprise :** tableau de bord commercial, financier, logistique, support, direction.

**Confusion fréquente :** un tableau de bord n’est pas un inventaire de tous les graphes possibles. Plus il montre tout, moins il aide souvent.

## KPI et indicateur

Ces deux mots sont proches, mais pas totalement équivalents.

- **Indicateur** : mesure suivie pour décrire une situation
- **KPI** : indicateur jugé clé pour piloter un objectif précis

**À quoi ça sert concrètement :** ils permettent de suivre la performance, les écarts et les tendances.

**Exemple en entreprise :**
- indicateur : nombre de commandes
- KPI : taux de service, marge, délai moyen de traitement, taux de conversion

**Confusion fréquente :** tous les indicateurs ne sont pas des KPI. Le mot KPI est souvent utilisé un peu trop généreusement.

## Modèle de données

Le **modèle de données** est la manière dont les tables sont organisées et reliées pour permettre l’analyse.

**À quoi ça sert concrètement :** un bon modèle simplifie les mesures, accélère les analyses et réduit les erreurs d’interprétation.

**Exemple en entreprise :** relier des ventes à des dimensions produit, client, date et commercial.

**Confusion fréquente :** beaucoup de problèmes Power BI viennent d’un mauvais modèle, pas d’un mauvais graphique.

## Table de faits et table de dimensions

Ces notions sont au cœur d’un modèle analytique propre.

- **Table de faits** : table qui contient les événements ou les valeurs à analyser  
  **Exemple :** ventes, lignes de commande, tickets, mouvements de stock.

- **Table de dimensions** : table qui décrit le contexte de ces faits  
  **Exemple :** client, produit, date, agence, commercial.

**À quoi ça sert concrètement :** cela rend le modèle plus lisible et le reporting plus robuste.

**Confusion fréquente :** on mélange souvent les attributs descriptifs et les faits numériques dans une même table, ce qui complique tout ensuite.

## Mesure

Une **mesure** est un calcul utilisé dans l’analyse et le reporting.

**À quoi ça sert concrètement :** elle permet de produire un total, une moyenne, un ratio, un cumul, un pourcentage ou tout autre calcul métier.

**Exemple en entreprise :** chiffre d’affaires, marge, nombre de tickets ouverts, délai moyen de traitement.

**Confusion fréquente :** une mesure n’est pas une simple colonne de plus. C’est un calcul pensé pour l’analyse.

---

# Les termes Power BI vraiment utiles

Power BI a son propre vocabulaire. Le comprendre évite beaucoup d’échanges flous avec un consultant ou une équipe BI.

## Power BI

**Power BI** est la plateforme de Microsoft dédiée à la préparation, la modélisation, la visualisation et le partage de données.

**À quoi ça sert concrètement :** construire des rapports et tableaux de bord à partir de plusieurs sources.

**Exemple en entreprise :** piloter ventes, finance, support, production ou logistique dans un même environnement.

**Confusion fréquente :** Power BI n’est pas seulement un outil de graphiques. Il inclut aussi la préparation, le modèle et le partage.

## Power Query

**Power Query** est le moteur de connexion et de préparation des données utilisé notamment dans Power BI.

**À quoi ça sert concrètement :** il sert à importer, filtrer, fusionner, transformer et préparer les données avant le modèle.

**Exemple en entreprise :** nettoyer un export Excel, fusionner deux tables, convertir des types, renommer des colonnes.

**Confusion fréquente :** Power Query prépare la donnée ; il ne remplace pas toujours un vrai ETL quand les flux deviennent nombreux, critiques ou industrialisés.

## DAX

**DAX** est le langage de formule utilisé dans Power BI pour créer des calculs analytiques.

**À quoi ça sert concrètement :** il permet de créer des mesures, colonnes calculées et logiques d’analyse plus avancées.

**Exemple en entreprise :** calculer un cumul annuel, une marge, une comparaison N/N-1 ou un taux de service.

**Confusion fréquente :** DAX n’est pas SQL. SQL va interroger des tables ; DAX travaille dans le modèle analytique.

## Mesure DAX

Une **mesure DAX** est un calcul dynamique évalué selon le contexte de filtre du rapport.

**À quoi ça sert concrètement :** elle permet de faire des calculs qui s’adaptent à la page, aux filtres, aux segments et au niveau d’analyse.

**Exemple en entreprise :** chiffre d’affaires filtré par année, agence, commercial ou famille produit.

**Confusion fréquente :** une mesure DAX ne stocke pas une valeur ligne par ligne comme une colonne.

## Colonne calculée

Une **colonne calculée** est une colonne créée dans le modèle à partir d’une formule DAX.

**À quoi ça sert concrètement :** elle sert surtout à ajouter une information dérivée au niveau de chaque ligne.

**Exemple en entreprise :** concaténer un code et un libellé, créer une catégorie, calculer un statut ligne par ligne.

**Confusion fréquente :** on utilise souvent une colonne calculée là où une mesure serait plus adaptée, et inversement.

## Rapport

Un **rapport** dans Power BI est l’ensemble des pages, visuels, filtres et interactions construits à partir d’un modèle.

**À quoi ça sert concrètement :** c’est l’objet consulté par les utilisateurs pour explorer l’information.

**Exemple en entreprise :** un rapport ventes avec une page synthèse, une page produit, une page région, une page détail.

**Confusion fréquente :** le rapport n’est pas la donnée elle-même. Il s’appuie sur un modèle sous-jacent.

## Workspace

Un **workspace** est l’espace de travail collaboratif dans lequel on organise et publie le contenu Power BI.

**À quoi ça sert concrètement :** gérer les rapports, les droits, la collaboration et la diffusion.

**Exemple en entreprise :** un workspace “Finance”, un workspace “Supply”, un workspace “Direction”.

**Confusion fréquente :** partager un rapport ne veut pas dire organiser correctement les contenus. Le workspace est aussi un sujet de gouvernance.

## Actualisation

L’**actualisation** correspond au rafraîchissement des données dans Power BI.

**À quoi ça sert concrètement :** elle met à jour le contenu affiché selon la fréquence prévue.

**Exemple en entreprise :** actualisation toutes les nuits, toutes les heures ou plusieurs fois par jour selon le besoin.

**Confusion fréquente :** un rapport publié n’est pas vivant par magie. Sans actualisation bien gérée, il vieillit très vite.

## DirectQuery

**DirectQuery** est un mode dans lequel Power BI interroge directement la source au lieu d’importer toutes les données dans le modèle.

**À quoi ça sert concrètement :** il permet de travailler sur des données qui restent dans la source.

**Exemple en entreprise :** interroger directement une base SQL pour afficher des indicateurs à jour sans import complet.

**Confusion fréquente :** DirectQuery n’est pas automatiquement “mieux” ou “plus moderne”. Il simplifie certains cas, mais il dépend aussi fortement des performances et de la structure de la source.

## Passerelle

La **passerelle** permet au service Power BI d’accéder à certaines sources, notamment locales ou non directement exposées au cloud.

**À quoi ça sert concrètement :** elle sert de pont sécurisé entre Power BI Service et les sources concernées.

**Exemple en entreprise :** actualiser un rapport publié à partir d’une base SQL sur site.

**Confusion fréquente :** publier un rapport ne suffit pas si la source reste inaccessible sans passerelle.

> ℹ️ Si tu veux un accompagnement plus opérationnel sur ces sujets, tu peux consulter mes [services Power BI](/services-powerbi/).

---

# Exploitation, sécurité et gouvernance sans jargon

Un flux utile n’est pas seulement un flux qui marche aujourd’hui. C’est un flux qu’on comprend, qu’on surveille et qu’on sécurise dans le temps.

## Log

Un **log** est une trace technique produite pendant l’exécution d’un traitement.

**À quoi ça sert concrètement :** comprendre ce qui s’est passé, diagnostiquer une erreur, vérifier un volume, retrouver un incident.

**Exemple en entreprise :** nombre de lignes lues, transformées, rejetées, temps d’exécution, message d’erreur.

**Confusion fréquente :** sans log, on finit souvent par diagnostiquer les problèmes au doigt mouillé. C’est rarement la meilleure méthode.

## Monitoring

Le **monitoring** consiste à surveiller l’état des flux et traitements dans la durée.

**À quoi ça sert concrètement :** détecter plus vite les anomalies, les retards ou les échecs.

**Exemple en entreprise :** suivre les chargements de nuit, le nombre d’échecs, les durées anormales, les fichiers absents.

**Confusion fréquente :** monitorer ne veut pas dire “ouvrir les logs quand ça casse”. C’est une surveillance continue.

## Alerte

Une **alerte** est un signal envoyé lorsqu’un événement anormal est détecté.

**À quoi ça sert concrètement :** prévenir rapidement l’équipe concernée au lieu d’attendre qu’un utilisateur remarque que “les chiffres ont l’air bizarres”.

**Exemple en entreprise :** mail ou notification Teams si un job échoue ou si un fichier attendu n’arrive pas.

**Confusion fréquente :** trop d’alertes tuent l’alerte. Il faut des alertes utiles, pas du bruit industriel.

## Incident

Un **incident** est un événement qui perturbe le fonctionnement attendu d’un flux, d’un rapport ou d’un service.

**À quoi ça sert concrètement de le qualifier :** comprendre l’impact, prioriser le traitement et organiser la reprise.

**Exemple en entreprise :** un job échoue, une actualisation ne passe plus, un KPI n’est plus alimenté.

**Confusion fréquente :** une anomalie technique n’est pas toujours un incident métier. L’impact réel compte.

## SLA

Un **SLA** définit un niveau de service attendu : délai, disponibilité, temps de traitement, engagement de qualité ou de support.

**À quoi ça sert concrètement :** cadrer ce qu’un flux ou un service doit garantir.

**Exemple en entreprise :** un reporting doit être prêt avant 8h, ou un flux d’intégration doit être repris dans un délai donné.

**Confusion fréquente :** un SLA n’est pas une promesse vague. Il doit être mesurable.

## Gouvernance des données

La **gouvernance des données** désigne l’ensemble des règles et responsabilités qui permettent de savoir quelles données existent, d’où elles viennent, qui les utilise et selon quelles règles.

**À quoi ça sert concrètement :** éviter les définitions floues, les versions concurrentes et les usages non maîtrisés.

**Exemple en entreprise :** définir qui valide le KPI “marge”, quelle source fait foi, qui peut publier un rapport, et comment on trace les changements.

**Confusion fréquente :** la gouvernance n’est pas réservée aux grands groupes. Même une PME gagne à poser quelques règles simples.

## RGPD

Le **RGPD** encadre l’usage des données personnelles dans l’Union européenne.

**À quoi ça sert concrètement :** il oblige à réfléchir à la finalité, à la conservation, à l’accès et à la protection des données concernant des personnes physiques.

**Exemple en entreprise :** données clients, salariés, prospects, utilisateurs, tickets nominatifs, emails, identifiants.

**Confusion fréquente :** RGPD ne veut pas dire “on ne peut rien faire”. Cela veut dire qu’il faut faire les choses proprement.

## Authentification et autorisation

Ces deux termes sont souvent mélangés.

- **Authentification** : vérifier qui tu es
- **Autorisation** : déterminer ce que tu as le droit de faire

**À quoi ça sert concrètement :** sécuriser l’accès aux APIs, aux rapports, aux workspaces et aux données sensibles.

**Exemple en entreprise :** un utilisateur se connecte avec son compte, puis n’accède qu’aux rapports prévus pour son rôle.

**Confusion fréquente :** être connecté ne veut pas dire être autorisé à tout voir.

## Rôle et permission

- **Rôle** : profil d’accès défini pour un ensemble d’utilisateurs
- **Permission** : droit concret accordé sur un objet ou une action

**À quoi ça sert concrètement :** structurer les accès proprement sans gérer les droits au cas par cas à la main pour chaque personne.

**Exemple en entreprise :** rôle “lecteur”, “éditeur”, “admin” dans un workspace Power BI ou sur un outil d’intégration.

**Confusion fréquente :** un rôle regroupe souvent plusieurs permissions, mais les deux notions ne sont pas identiques.

## Token

Un **token** est un jeton technique utilisé pour authentifier ou autoriser un accès applicatif.

**À quoi ça sert concrètement :** permettre à un flux ou à une application d’appeler une API de manière sécurisée.

**Exemple en entreprise :** un job Talend utilise un token pour lire des commandes depuis une API partenaire.

**Confusion fréquente :** un token n’est pas juste “un mot de passe un peu différent”. Son cycle de vie, sa durée et ses droits comptent énormément.

> ℹ️ Sur la partie sécurité, tu peux aussi regarder [Chiffre vraiment tes mots de passe Talend & Talaxie : passer à AES](/blog/chiffrer-des-mots-de-passe-AES/).

---

# Conclusion — Un bon projet data commence rarement par un dashboard

Quand on parle data en entreprise, on pense souvent d’abord à l’outil.

Power BI. Talend. API. SQL. Dashboard. Automatisation.

Mais dans les faits, un projet data solide commence plus tôt : il commence quand les mots sont clairs.

Comprendre ce qu’est une source de vérité, une granularité, un mapping, une jointure, une mesure DAX ou une règle de qualité, ce n’est pas du vernis technique. C’est ce qui évite les mauvaises hypothèses, les reportings contestés et les pipelines bricolés.

Autrement dit :

- un bon flux commence par une structure claire
- une bonne BI commence par une donnée fiable
- un bon projet commence par un vocabulaire partagé

Et c’est souvent là que tout se joue.

Si tu veux aller plus loin, le prolongement naturel de ce glossaire se fait sur quatre sujets très concrets :

- l’intégration de données avec Talend ou Talaxie
- la structuration d’un modèle Power BI propre
- la qualité de données dans les flux
- la gouvernance simple mais utile des indicateurs et des accès

---

# À retenir

- Une donnée brute n’est pas encore une information exploitable.
- Beaucoup d’erreurs de reporting viennent d’un problème de granularité, de jointure ou de source de vérité.
- Un ETL ou un pipeline ne sert pas juste à déplacer des données, mais à les rendre fiables et exploitables.
- La qualité de données n’est pas un sujet secondaire : elle conditionne la confiance dans les KPI.
- Dans Power BI, Power Query, DAX, les mesures, l’actualisation et le mode de connexion n’ont pas le même rôle.
- Un flux utile doit aussi être surveillé, sécurisé et gouverné dans la durée.

---

# ℹ️ Aller plus loin sur BMData

Si tu veux relier ce glossaire à des cas concrets, tu peux continuer avec ces contenus :

- [Architecture data simple pour PME : structurer un pipeline entre les sources, l’ETL et la BI](/blog/architecture-data-pme/)
- [Talend/Talaxie : comment les entreprises automatisent leurs données sans infrastructure complexe](/blog/utilisation-talend/)
- [API vs Webhook : comprendre la différence et implémenter un webhook sécurisé avec Talaxie](/blog/API-et-Webhook-talaxie-esb/)
- [Talaxie : sécuriser l’entrée du pipeline avec tSchemaComplianceCheck](/blog/tSchemaComplianceCheck/)
- [Talaxie : bien configurer tWriteJSONField et le JSON Tree](/blog/tWriteJSONField/)
- [Migration de Talend Open Studio vers Talaxie : guide complet en 8 étapes](/blog/migration-talend-vers-talaxie/)
- [Services Talend & Talaxie](/services-talend-talaxie/)
- [Services Power BI](/services-powerbi/)
- [Réalisations data & automatisation](/realisation/)

---

# Sources

## Sources officielles

- [Microsoft Learn — Qu’est-ce que Power Query ?](https://learn.microsoft.com/fr-fr/power-query/power-query-what-is-power-query)
- [Microsoft Learn — Référence DAX](https://learn.microsoft.com/fr-fr/dax/)
- [Microsoft Learn — Vue d’ensemble de DAX](https://learn.microsoft.com/fr-fr/dax/dax-overview)
- [Microsoft Learn — Créer des colonnes calculées dans Power BI Desktop](https://learn.microsoft.com/fr-fr/power-bi/transform-model/desktop-calculated-columns)
- [Microsoft Learn — Tutoriel : créer des mesures dans Power BI Desktop](https://learn.microsoft.com/fr-fr/power-bi/transform-model/desktop-tutorial-create-measures)
- [Microsoft Learn — Découvrez le schéma en étoile et son importance pour Power BI](https://learn.microsoft.com/fr-fr/power-bi/guidance/star-schema)
- [Microsoft Learn — Utilisation de DirectQuery dans Power BI Desktop](https://learn.microsoft.com/fr-fr/power-bi/connect-data/desktop-use-directquery)
- [Microsoft Learn — Configurer une actualisation planifiée dans Power BI](https://learn.microsoft.com/fr-fr/power-bi/connect-data/refresh-scheduled-refresh)
- [Microsoft Learn — Planification des passerelles de données Power BI](https://learn.microsoft.com/fr-fr/power-bi/guidance/powerbi-implementation-planning-data-gateways)
- [Microsoft Learn — Espaces de travail dans Power BI](https://learn.microsoft.com/fr-fr/power-bi/collaborate-share/service-new-workspaces)
- [Qlik / Talend Help — Error handling in Talend Studio](https://help.qlik.com/talend/en-US/studio-user-guide/8.0-R2024-12/error-handling-in-talend-studio)
- [Qlik / Talend Help — Logs and errors scenarios](https://help.qlik.com/talend/en-US/components/8.0/logs-and-errors/logs-and-errors-scenario)
- [Qlik / Talend Help — Orchestration components](https://help.qlik.com/talend/en-US/components/8.0/orchestration/orchestration-component)
- [Qlik / Talend Help — tJoin](https://help.qlik.com/talend/fr-FR/components/8.0/processing/tjoin)
- [Qlik / Talend Help — tHMap](https://help.qlik.com/talend/fr-FR/components/8.0/data-mapping/thmap)
- [AWS — Quelle est la différence entre ETL et ELT ?](https://aws.amazon.com/fr/compare/the-difference-between-etl-and-elt/)
- [AWS — Qu’est-ce qu’un data warehouse ?](https://aws.amazon.com/fr/what-is/data-warehouse/)
- [IETF — RFC 4180 : Common Format and MIME Type for CSV Files](https://www.rfc-editor.org/rfc/rfc4180)
- [IETF — RFC 8259 : The JavaScript Object Notation (JSON) Data Interchange Format](https://www.rfc-editor.org/info/rfc8259)
- [W3C — Extensible Markup Language (XML)](https://www.w3.org/XML/)
- [IETF — RFC 6749 : The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/info/rfc6749)
- [CNIL — Identifier les données personnelles](https://www.cnil.fr/fr/identifier-les-donnees-personnelles)
- [CNIL — L’anonymisation de données personnelles](https://www.cnil.fr/fr/technologies/lanonymisation-de-donnees-personnelles)

## Sources BMData

- [BMData — Accueil](https://bmdata.fr/)
- [BMData — Services Talend & Talaxie](https://bmdata.fr/services-talend-talaxie/)
- [BMData — Services Power BI](https://bmdata.fr/services-powerbi/)
- [BMData — Réalisations data & automatisation](https://bmdata.fr/realisation/)
- [BMData — Talend/Talaxie : comment les entreprises automatisent leurs données sans infrastructure complexe](https://bmdata.fr/blog/utilisation-talend/)
- [BMData — API vs Webhook : comprendre la différence et implémenter un webhook sécurisé avec Talaxie](https://bmdata.fr/blog/API-et-Webhook-talaxie-esb/)
- [BMData — Talaxie : sécuriser l’entrée du pipeline avec tSchemaComplianceCheck](https://bmdata.fr/blog/tSchemaComplianceCheck/)
- [BMData — Talaxie : bien configurer tWriteJSONField et le JSON Tree](https://bmdata.fr/blog/tWriteJSONField/)
- [BMData — Migration de Talend Open Studio vers Talaxie : guide complet en 8 étapes](https://bmdata.fr/blog/migration-talend-vers-talaxie/)

---

# 5 titres alternatifs

1. **Glossaire data : 50 termes utiles pour mieux comprendre Talend, Power BI et la BI**
2. **Les mots de la data expliqués simplement : API, ETL, KPI, DAX, qualité de données**
3. **Comprendre le vocabulaire data en entreprise : le glossaire utile pour la BI et l’intégration**
4. **Glossaire Talend / Power BI : les termes à connaître pour fiabiliser tes flux et tes reportings**
5. **De l’API au KPI : le glossaire data concret pour les PME et les équipes métier**

---

# 10 idées de posts LinkedIn à recycler

## 1) Le jargon qui ralentit les projets data
**Angle :** ce ne sont pas toujours les outils qui bloquent, mais les mots mal compris.  
**Hook possible :**  
> Beaucoup de projets data ne déraillent pas à cause de Power BI ou de Talend.  
> Ils déraillent parce que tout le monde utilise les mêmes mots… sans parler de la même chose.

## 2) Donnée vs information
**Angle :** montrer qu’une donnée brute ne vaut pas encore analyse.  
**Hook possible :**  
> Un montant, une date, un statut : ce sont des données.  
> Tant qu’il manque le contexte, ce n’est pas encore une information utile.

## 3) Pourquoi la granularité casse tant de KPI
**Angle :** expliquer simplement l’impact du niveau de détail sur les indicateurs.  
**Hook possible :**  
> Beaucoup de KPI “faux” ne viennent pas d’un mauvais calcul.  
> Ils viennent d’une mauvaise granularité.

## 4) Clé primaire, clé étrangère : les notions simples qui évitent des dashboards faux
**Angle :** vulgarisation terrain des relations entre tables.  
**Hook possible :**  
> Une mauvaise relation entre tables ne crie pas forcément.  
> Elle peut juste te donner un dashboard crédible… et faux.

## 5) API vs webhook
**Angle :** différencier logique de récupération et logique de notification.  
**Hook possible :**  
> Une API, tu la sollicites.  
> Un webhook, il te prévient.  
> Cette nuance change beaucoup de choses dans un pipeline.

## 6) ETL vs ELT
**Angle :** démystifier le débat.  
**Hook possible :**  
> ETL ou ELT ?  
> Le plus gros problème n’est pas le sigle.  
> Le vrai sujet, c’est l’endroit où tu laisses vivre la logique métier.

## 7) Excel n’est pas le problème… jusqu’à un certain point
**Angle :** posture nuancée et crédible.  
**Hook possible :**  
> Excel n’est pas l’ennemi.  
> Mais quand il devient à la fois source, transformation, contrôle qualité et reporting, tu construis surtout une fragilité.

## 8) KPI vs indicateur
**Angle :** clarifier une confusion très fréquente côté métier.  
**Hook possible :**  
> Tous les KPI sont des indicateurs.  
> Tous les indicateurs ne sont pas des KPI.  
> Et cette confusion pollue beaucoup de tableaux de bord.

## 9) Mesure DAX vs colonne calculée
**Angle :** expliquer une confusion classique dans Power BI.  
**Hook possible :**  
> Dans Power BI, beaucoup de modèles deviennent lourds pour une raison simple :  
> on met des colonnes calculées là où il faudrait des mesures.

## 10) Un bon reporting commence avant Power BI
**Angle :** rappeler que le modèle et la qualité priment sur le visuel.  
**Hook possible :**  
> Un bon reporting ne commence pas avec un graphique.  
> Il commence avec une donnée propre, une structure claire et des définitions partagées.

---