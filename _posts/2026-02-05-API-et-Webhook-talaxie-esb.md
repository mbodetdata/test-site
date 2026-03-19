---
layout: post
title: "API vs Webhook : comprendre la différence et implémenter un webhook sécurisé avec Talaxie"
description: "Article concret pour comprendre API vs webhook, puis mettre en place un endpoint webhook en Talaxie ESB (Karaf/CXF JAX-RS), le tester avec Postman, et le sécuriser avec GitHub + HMAC — exposé proprement via Caddy."
categories: blog
tags: [API, Webhook, Talaxie ESB,Karaf, Sécurité, HMAC, GitHub, Reverse proxy, Caddy]
image: "/assets/img/blog/10-esb-api-webhook/logo_1024.webp"
active: true
parent_category: data
category_label: ESB
---

# Introduction — Une API, tu la sollicites. Un webhook, il te prévient.

Quand tu débutes, tu mets souvent **API** et **webhook** dans le même sac : *“un truc HTTP”*.  
Sauf que la différence n’est pas un détail : c’est une **question de direction**.

- Une **API** : c’est toi qui **appelles** un service quand tu en as besoin (**pull**).
- Un **webhook** : c’est un service externe qui **t’appelle** quand un événement arrive (**push**).

> **Imagine un service postal :**
> - **API** = tu vas au bureau de poste demander : *“Mon colis en est où ?”*  
>   Tu y vas **quand tu veux**, autant de fois que tu veux, et tu repars avec une réponse.
> - **Webhook** = tu donnes ton adresse au facteur : *“Dès qu’il y a une mise à jour, tu passes.”*  
>   Tu ne contrôles ni **l’heure**, ni **la fréquence**, tu dois juste être prêt à recevoir.

Et ce “sens” change des choses très concrètes :
- Ton **architecture** (pull vs push),
- Ta **sécurité** (qui prouve quoi, et comment),
- Tes **tests** (tu maîtrises vs tu simules),
- Ta **prod** (pics, retries, doublons → rigueur obligatoire).

---


> - **API** : tu vas chercher l’info.
> - **Webhook** : on te pousse l’info.
>
> **Résultat à la fin du tuto :**   
> 
> 1) un endpoint Talaxie ESB qui répond en local  
> 2) le même endpoint exposé en HTTPS derrière Caddy  
> 3) un webhook GitHub **signé (HMAC SHA-256)**, **vérifié côté Talaxie**, avec des réponses 200/401 propres

---

## Une API REST, c’est quoi ?

Une API REST, c’est un service que tu **interroges** :  
tu envoies une requête → tu récupères une réponse.

Elle sert typiquement à :
- **lire** des données (GET),
- **créer** ou **modifier** (POST / PUT / PATCH),
- **déclencher** une action (POST).

### Le point clé
Avec une API, tu pilotes tout :
- **quand** tu appelles,
- **combien de fois**,
- **quoi** demander,
- **comment** gérer les erreurs (retry, timeout, fallback).

### Mini-exemple (GitHub)
Tu veux le nombre de stars d’un repo ?  
→ tu appelles l’API GitHub, tu obtiens la valeur **au moment T**.

Mais si tu veux être **prévenu** dès qu’une star est ajoutée  
→ une API seule te pousse à faire du *polling* (appeler en boucle) : inefficace, bruyant, et pas très élégant.

---

## Un webhook, c’est quoi ?

Un webhook, c’est l’inverse : tu exposes une URL, et un service externe **t’envoie** une requête HTTP quand un événement se produit.

En clair :
---
> “Quand ça arrive, appelle-moi ici.”

### Le point clé
Tu ne maîtrises pas le déclenchement. Donc tu dois être prêt à gérer :
- le **timing** (n’importe quand),
- le **volume** (pics),
- les **retries** et les **doublons** (très courant).

### Les 4 sujets à traiter
- **Authenticité** : prouver que l’émetteur est légitime (signature/secret).
- **Robustesse** : encaisser des pointes sans tomber.
- **Idempotence** : supporter les renvois sans traiter deux fois.
- **Observabilité** : logs, statuts, rejets compréhensibles.

---

## API vs webhook : la règle utile

- **Webhook** = “un événement vient d’arriver” (signal)
- **API** = “je récupère les détails” (enrichissement)

Exemple :
- GitHub te notifie : “star ajoutée”
- Puis tu appelles l’API pour récupérer ce qui t’intéresse (repo, auteur, méta-données, etc.)

> Maintenant qu’on parle le même langage, on passe à la mise en place.

---

# Prérequis

Avant d’attaquer le tuto, voilà ce qu’il te faut.

## Ce qu’il te faut
- **Talaxie ESB** (V202511) — [Téléchargement](https://deilink.fr/#/download)
- **Un runtime Talaxie/Talend (Karaf / Runtime_ESBSE)** — [Téléchargement](https://github.com/mbodetdata/BMDATA_Runtime_ESBSE_Talend-Talaxie)
- **Un compte GitHub** et un repo de test (même vide)
- **Caddy installé** (reverse proxy + HTTPS) — [Téléchargement](https://caddyserver.com/download)

## Le setup que j’utilise (pour que tu aies le contexte)
- Je déploie le runtime **Karaf** sur une **VM Ubuntu Server**.  
  > Ça marche aussi sur Windows, mais les chemins et quelques commandes changent.
- J’utilise un DNS dynamique (**DuckDNS**) pour exposer un nom de domaine sans taper mon IP publique.
- Comme la VM est sur mon réseau local, je dois **rendre le serveur joignable depuis Internet** :
  - ouvrir / rediriger **80 (HTTP)** et **443 (HTTPS)** vers la VM (NAT/port forwarding + firewall).

---

# Le cas simple — un endpoint “Hello World” testable avec Postman

On commence volontairement **très simple** : un mini endpoint que tu peux appeler depuis **Postman**.  
C’est ton *hello world* version ESB : juste assez pour comprendre le trio gagnant :

- le **Studio ESB** (où tu construis),
- **Karaf** (où ça tourne en continu),
- **Caddy** (qui expose proprement en HTTPS),

Tout ça, sans te perdre dans un labyrinthe de config dès la première page.

---

## Ouverture du Studio : 2 réglages à faire tout de suite (sinon tu vas perdre du temps)

Tu as ouvert **Studio Talaxie ESB** ? Parfait. Avant d’ajouter le moindre composant, fais ces deux réglages.  
Ce sont des “petits clics” qui évitent des “grands drames”.

### 1) Activer la compatibilité **Java 17** (côté Studio)

Menu :
**Fichier → Modifier les propriétés du projet → Construire → Version de Java**  
et coche **“Activer la compatibilité avec Java 17”**.

![Activer la compatibilité Java 17]({{ '/assets/img/blog/10-esb-api-webhook/1-compatibilite-java-17.webp' | relative_url }}){:alt="Activer la compatibilité Java 17" loading="lazy" decoding="async"}

> ⚠️ Important : **ton runtime reste en Java 11.**  
> Activer la compatibilité Java 17 dans le Studio ne veut pas dire “je passe le runtime en 17”.  
> Ça te permet surtout de **ne plus être bloqué en Java 8** côté projet et d’être compatible avec **Java 11+**.

### 2) Désactiver Maven Offline

Menu :
**Fenêtre → Preferences → Maven**  
et **décoche** l’option **Offline**.

![Décoche Maven Offline]({{ '/assets/img/blog/10-esb-api-webhook/1-maven-offline.webp' | relative_url }}){:alt="Décoche l'option offline de maven" loading="lazy" decoding="async"}

> Sinon, tôt ou tard : dépendances qui manquent, et Karaf qui deviens capricieux !

---

## Développer ton premier endpoint (“Hello World”)

Crée un **nouveau Job ESB**.  
Dans mon exemple, je l’appelle `Exemple_webhook`.

![Création d'un nouveau job]({{ '/assets/img/blog/10-esb-api-webhook/2-creation-job.webp' | relative_url }}){:alt="Creation d'un nouveau job" loading="lazy" decoding="async"}

---

### Étape 1 — Mets des logs tout de suite 

Un job ESB, dans Karaf, c’est souvent un service qui **tourne en continu**.  
Donc si tu n’as pas de logs, tu vas vite te retrouver à fixer la console en espérant un miracle.

Pour ce lab, on fait minimal (mais utile) :
- `tPreJob` + `tWarn` : “le job démarre”
- `tLogCatcher` + `tLogRow` : voir passer les messages

![Instanciation des logs]({{ '/assets/img/blog/10-esb-api-webhook/2-logs.webp' | relative_url }}){:alt="Instanciation des logs" loading="lazy" decoding="async"}

> En prod, tu feras mieux (logs persistés, corrélation, niveaux, contextes).  
> Ici, objectif : **comprendre le flux**, pas bâtir un projet.

---

### Étape 2 — Ajoute le composant d’entrée : `tRestRequest`

Si tu connais `tRestClient`, c’est normal : il sert à **appeler** une API.  
Ici, tu veux **exposer** un endpoint : donc `tRestRequest`.

![Ajout du tRestRequest]({{ '/assets/img/blog/10-esb-api-webhook/2-trestrequest-1.webp' | relative_url }}){:alt="Ajout du tRestRequest" loading="lazy" decoding="async"}

` tRestRequest ` = la **porte d’entrée HTTP** de ton job.

> ⚠️ Piège classique : vouloir contextualiser l’URL/endpoint du `tRestRequest`.  
> Dans Karaf, ça peut **marcher en Studio** puis **casser au runtime**.  
> Règle simple : **garde l’endpoint interne stable**, et fais varier l’exposition via **Caddy**.

---

### Étape 3 — Crée la route `POST /services/webhook/test`

Dans `tRestRequest`, clique sur le **+ vert** pour ajouter une route.

![Ajout de notre premiere route]({{ '/assets/img/blog/10-esb-api-webhook/2-1-trestrequest-ajout-route.webp' | relative_url }}){:alt="Ajout de notre premiere route" loading="lazy" decoding="async"}

Donne-lui un nom (ex. `webhook_test`) via les **3 petits points** du flux.

![Nommage de notre premiere route]({{ '/assets/img/blog/10-esb-api-webhook/2-1-trestrequest-ajout-route-flux1.webp' | relative_url }}){:alt="Nommage de notre premiere route" loading="lazy" decoding="async"}

Pour ce lab, tu peux laisser le schéma vide.

![On laisse le schéma vide]({{ '/assets/img/blog/10-esb-api-webhook/2-1-trestrequest-ajout-route-flux1-shema.webp' | relative_url }}){:alt="On laisse le schéma vide" loading="lazy" decoding="async"}

Paramètres de la route :
- **Verbe** : `POST`
- **URI** : `/services/webhook/test`
- **Consume** : JSON
- **Produce** : JSON

![Configuration du flux]({{ '/assets/img/blog/10-esb-api-webhook/2-1-trestrequest-ajout-route-flux1-conf.webp' | relative_url }}){:alt="Configuration du flux" loading="lazy" decoding="async"}

> Ton endpoint local devient : **POST** `http://localhost:8088/services/webhook/test`

---

### Étape 4 — Ajoute un minimum de “signal” dans la branche

L’objectif ici est simple : **être sûr que la route déclenche bien quelque chose**.

Option pratique (et simple à maintenir) :
- `tFlowToIterate` (si tu veux enchaîner facilement)
- `tJava` (si tu veux piloter via `OnComponentOk`)
- un `tWarn` pour confirmer l’exécution

![Suite de la configuration du flux]({{ '/assets/img/blog/10-esb-api-webhook/2-1-suite-flux.webp' | relative_url }}){:alt="Suite de la configuration du flux" loading="lazy" decoding="async"}

![Ajout d'un tWarn]({{ '/assets/img/blog/10-esb-api-webhook/2-1-suite-flux-twarn.webp' | relative_url }}){:alt="Ajout d'un tWarn pour logguer le flux." loading="lazy" decoding="async"}

---

### Étape 5 — Lance le job

Lance le job dans le Studio.

![Exécution du job dans Talaxie]({{ '/assets/img/blog/10-esb-api-webhook/2-1-execution.webp' | relative_url }}){:alt="Exécution du job dans Talaxie" loading="lazy" decoding="async"}

> S’il ne s’arrête pas : c’est normal.  
> Un job ESB exposant une API tourne **en continu**, contrairement à un job DI batch.

---

### Étape 6 — Test Postman : le 404 “logique”

Appelle l’endpoint dans Postman.

![Résultat dans postman]({{ '/assets/img/blog/10-esb-api-webhook/2-1-execution-postman.webp' | relative_url }}){:alt="Résultat dans postman" loading="lazy" decoding="async"}

Tu obtiens un **404** ? Ce n’est pas (forcément) que ta route n’existe pas.  
C’est souvent plus simple : tu ne renvoies **aucune réponse**.

Le HTTP fonctionne en mode **requête → réponse**.  
Donc il te manque `tRestResponse`.

Ajoute :
- `tFixedFlowInput` (ex. message `"Hello World !"`)
- puis `tRestResponse` connecté en **main**

![Ajout du tRestResponse]({{ '/assets/img/blog/10-esb-api-webhook/2-1-execution-trestresponse.webp' | relative_url }}){:alt="Ajout d'un composant de reponse, le tRestResponse" loading="lazy" decoding="async"}

Relance, puis reteste.

![Retest avec postman]({{ '/assets/img/blog/10-esb-api-webhook/2-1-execution-trestresponse-postman.webp' | relative_url }}){:alt="Retest avec postman" loading="lazy" decoding="async"}

✅ Tu as maintenant un endpoint qui répond : ton “Hello World” est prêt.

> Prochaine étape : le déployer dans le **Runtime_ESBSE (Karaf)** et l’exposer proprement via Caddy.

---

## Déploiement dans le container Karaf (Runtime_ESB)

Maintenant, on sort du Studio : on va faire tourner ton job **dans Karaf** (Runtime_ESBSE).  
Objectif : que ton endpoint vive **dans le runtime**, pas uniquement dans ton IDE.

### Prérequis
- Un **runtime Karaf / Runtime_ESBSE** installé
- **Java 11** sur la machine qui exécute Karaf
- **Caddy** si tu veux exposer ensuite en HTTPS
- Côté réseau : **80/443 ouverts** uniquement si tu exposes depuis Internet

> Je le fais sur une VM Ubuntu Server. Sur Windows, même logique : chemins/commandes différents mais concepts identiques.

---

### Étape 1 — Construire le job 

Pour déployer il faut d’abord **builder**.  
Ici, ton job ESB est packagé en **bundle OSGi**,donc exploitable par Karaf.

Résultat attendu : un **.jar** prêt à être déployé.

---

### Étape 2 — Déposer le JAR dans le dossier `deploy`

Copie le JAR dans le dossier de déploiement automatique du runtime :

`/container/deploy`

Exemple chez moi :  
`/home/usertest/Runtime_ESBSE_V8/container/deploy`

> Si tu le poses au bon endroit, Karaf tente généralement de l’installer automatiquement.

---

### Étape 3 — Démarrer Karaf et vérifier l’installation

Démarre le runtime avec :

`/container/bin/trun`

Puis surveille la console/logs.

![Instanciation de karaf]({{ '/assets/img/blog/10-esb-api-webhook/3-1-Karaf.webp' | relative_url }}){:alt="Instanciation de karaf" loading="lazy" decoding="async"}

#### Si le bundle ne s’installe pas automatiquement
Installe-le à la main dans la console Karaf :

~~~sh
bundle:install -s file:/chemin/vers/ton/jar
~~~

Exemple :

~~~sh
bundle:install -s file:/home/usertest/Runtime_ESBSE_V8/container/deploy/Exemple_webhook-0.1.jar
~~~

#### Vérifier la version Java utilisée par Karaf
Dans la console Karaf :

~~~sh
system:property java.runtime.version
~~~

> Si Karaf n’utilise pas **Java 11**, tu peux te retrouver avec des erreurs d’instanciation ou un bundle qui refuse de démarrer.  
> Et tu vas perdre du temps sur le mauvais suspect.

---

## Configuration de Caddy

Pour l’instant, ton job tourne dans Karaf mais il est souvent joignable **uniquement en local**.  
Si tu veux recevoir des appels **depuis l’extérieur** (Postman, GitHub,etc), tu as besoin d’une porte d’entrée propre.

Caddy va faire le job :
- il expose une URL publique en **HTTPS**,
- et **reverse-proxy** vers ton runtime Talaxie/Talend en local.

> Bonus : tu n’exposes pas Karaf “en direct” sur Internet et c'est une très bonne habitude.

---

### DNS (DuckDNS) : optionnel, mais pratique

Tu peux utiliser DuckDNS pour avoir un nom de domaine (ex. `tonlab.duckdns.org`) au lieu d’une IP.

---

### Mise à jour automatique de l’IP (script + cron / tâche planifiée)

Si ton IP change, ton domaine doit suivre.  
Avec DuckDNS, un script exécuté régulièrement suffit.

Remplace :
- `TON_NOM_DE_DOMAINE`
- `TON_TOKEN`

![DuckDNS site]({{ '/assets/img/blog/10-esb-api-webhook/3-1-duckDNS.webp' | relative_url }}){:alt="Illustration de duck dns pour trouver le domaine et le token" loading="lazy" decoding="async"}

#### Linux (bash)

~~~sh
#!/bin/bash
# Mise à jour DuckDNS (IP publique détectée automatiquement si ip= vide)

DOMAIN="TON_NOM_DE_DOMAINE"
TOKEN="TON_TOKEN"

mkdir -p ~/duckdns
echo url="https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=" \
  | curl -k -o ~/duckdns/duck.log -K -
~~~

Cron (ex. toutes les 5 minutes) :

~~~sh
crontab -e
~~~

~~~sh
*/5 * * * * /bin/bash /chemin/vers/duckdns.sh >/dev/null 2>&1
~~~

#### Windows (batch)

~~~bat
@echo off
REM ============================================
REM Mise à jour DuckDNS (IP publique automatique)
REM ============================================

set DOMAIN=TON_NOM_DE_DOMAINE
set TOKEN=TON_TOKEN
set LOGFILE=%USERPROFILE%\duckdns\duck.log

REM Crée le dossier de logs s'il n'existe pas
if not exist "%USERPROFILE%\duckdns" (
    mkdir "%USERPROFILE%\duckdns"
)

REM Appel DuckDNS (ip= vide => IP publique détectée automatiquement)
curl https://www.duckdns.org/update?domains=%DOMAIN%^&token=%TOKEN%^&ip= -o "%LOGFILE%"
~~~

---

## Créer le Caddyfile, le “plan de routage”

Caddy se configure via un fichier : **`Caddyfile`** (souvent `/etc/caddy/Caddyfile` sur Ubuntu).

Il dit à Caddy :
- “quand on appelle `https://ton-domaine/...`”
- “tu proxies vers `http://127.0.0.1:8088/...`”

> Voici un CaddyFile prêt a l'emploi


~~~t
{
	# ============================================
	# CONFIG GLOBALE CADDY
	# ============================================
	# Décommente temporairement si tu dois diagnostiquer Caddy.
	# ⚠️ Très verbeux en prod.
	# debug

	# Optionnel : email pour ACME/Let's Encrypt (utile pour alertes)
	# email toi@example.com
}

# =========================================================
# 1) PORT 80 : redirection HTTP -> HTTPS UNIQUEMENT
#    pour le domaine attendu, sinon 404 (anti-scan)
# =========================================================
:80 {
	# Autorise uniquement le host prévu (évite que le serveur réponde
	# à des hosts "au hasard" lors de scans)
	@duck host TON_DOMAINE.duckdns.org

	# Redirection permanente vers HTTPS en conservant host + URI
	redir @duck https://{host}{uri} permanent

	# Tout le reste => 404 (stealth/anti-scan)
	respond 404
}

# =========================================================
# 2) SITE HTTPS PRINCIPAL
# =========================================================
TON_DOMAINE.duckdns.org {

	# ---------------------------------------------------------
	# Compression (utile sur JSON/XML; pas critique sur petits payloads)
	# ---------------------------------------------------------
	encode gzip

	# ---------------------------------------------------------
	# Logs d'accès en JSON dans un fichier dédié
	# - Pratique pour parser/grep/ingérer dans ELK/Loki
	# - Le status 404 est attendu sur les URLs non gérées (fallback)
	# ---------------------------------------------------------
	log {
		output file /var/log/caddy/webhook-access.log
		format json
	}

	# ---------------------------------------------------------
	# Headers HTTP de sécurité "de base"
	# ---------------------------------------------------------
	header {
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "no-referrer"

		# Optionnel : HSTS (force HTTPS côté navigateur)
		# ⚠️ À activer uniquement si tu es sûr de servir en HTTPS durablement.
		# Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
	}

	# =========================================================
	# 3) WEBHOOK TEST (CUSTOM) — Token simple
	#
	# URL publique      : POST https://TON_DOMAINE.duckdns.org/webhook/test
	# Service interne   : http://127.0.0.1:8088/services/webhook/test
	#
	# Objectifs :
	# - N'accepter QUE POST
	# - Protéger via header X-Webhook-Token (secret statique)
	# - Réécrire l'URL publique -> endpoint Talend/CXF
	# - Reverse proxy vers Talend Runtime local (port 8088)
	# =========================================================

	# --- (3.1) Match sur le chemin public ---
	@wh_test path /webhook/test

	# --- (3.2) Méthodes non autorisées ---
	@wh_test_badmethod {
		path /webhook/test
		not method POST
	}
	handle @wh_test_badmethod {
		respond 405
	}

	# --- (3.3) Token manquant ou incorrect ---
	# Remplace TON_SECRET_TRES_LONG par une valeur longue + aléatoire.
	@wh_test_badtoken {
		path /webhook/test
		not header X-Webhook-Token "TON_SECRET_TRES_LONG"
	}
	handle @wh_test_badtoken {
		respond 401
	}

	# --- (3.4) OK : POST + token correct ---
	handle @wh_test {
		# Réécriture pour coller au mapping Talend/CXF
		rewrite * /services/webhook/test

		# Proxy vers Talend
		reverse_proxy 127.0.0.1:8088 {
			# On force "localhost" pour que CXF ne se base pas sur le host public
			header_up Host localhost:8088
			header_up X-Forwarded-Host localhost:8088
			header_up X-Forwarded-Proto http

			# Optionnel : transmettre l'IP client explicitement
			# header_up X-Real-IP {remote_host}
		}
	}

	# =========================================================
	# 4) FALLBACK : tout ce qui n'est pas explicitement géré
	# =========================================================
	respond 404
}

~~~

---

## Valider, formatter, recharger

Après modification du Caddyfile :

### 1) Valider la config
~~~sh
caddy validate --config /etc/caddy/Caddyfile
~~~

### 2) Formatter (optionnel)
~~~sh
caddy fmt --overwrite /etc/caddy/Caddyfile
~~~

### 3) Recharger ou redémarrer
~~~sh
sudo systemctl reload caddy
~~~

~~~sh
sudo systemctl restart caddy
~~~

### Vérifier que Caddy tourne et lire les logs
~~~sh
sudo systemctl status caddy --no-pager
~~~

~~~sh
sudo journalctl -u caddy -n 100 --no-pager
~~~

---

## Test Postman (depuis l’extérieur)

URL publique (exemple) :  
`https://testesb.duckdns.org/webhook/test`

### Test 1 — Sans token (tu dois être refusé)
Résultat attendu : **401 Unauthorized**.

![Unauthorized dans postman]({{ '/assets/img/blog/10-esb-api-webhook/3-1-postman.webp' | relative_url }}){:alt="Unauthorized dans postman" loading="lazy" decoding="async"}

### Test 2 — Avec le token (tu dois passer)
Header :
- `X-Webhook-Token: TON_SECRET_TRES_LONG`

Résultat attendu : **200 OK**.

![200 - OK Postman]({{ '/assets/img/blog/10-esb-api-webhook/3-1-postman-ok.webp' | relative_url }}){:alt="200 - OK Postman" loading="lazy" decoding="async"}

✅ Si tu as ça, ton webservice de test est fonctionnel et Caddy filtre déjà un minimum.

Mais un token statique, c’est bien pour un lab mais c'est vite limité.

> 🔁 **Et si tu passais à la signature ? (Partie 2)**  
> Le token statique, c’est parfait pour valider le flux… mais en prod ça montre vite ses limites.  
> Dans la partie 2, tu passes côté émetteur : **génération HMAC-SHA256**, header `X-Signature-256`, et envoi via `tRESTClient`.  
> 👉 [https://bmdata.fr/blog/API-et-Webhook-talaxie-esb-2/](https://bmdata.fr/blog/API-et-Webhook-talaxie-esb-2/)

La suite devient vraiment intéressante : **webhook GitHub + signature HMAC**, preuve d’authenticité.

---

# Le cas plus complexe — un webhook GitHub (Stars) avec signature HMAC

Ici on passe du “webhook de test” à un cas réel : **GitHub** t’envoie une requête HTTP quand quelqu’un **ajoute** ou **retire** une étoile sur un repo.  
L’objectif : Comprendre les mecanisme derriere le webhook, et comment ça s'implemente.

## Prérequis
- Avoir terminé le cas simple précédent
- Un compte **GitHub**
- Un repo (même vide)

---

## Configurer le webhook côté GitHub

Dans **Settings → Webhooks** de ton repo, crée un webhook avec :

- **Payload URL** : `https://TON_DOMAINE.duckdns.org/webhook/github`  
  (ex. `https://testesb.duckdns.org/webhook/github`)
- **Content type** : `application/json`
- **Secret** : `TON_SECRET_TRES_LONG_POUR_GITHUB`
- **Événements** : sélectionne **Stars** (événement `star`, actions `created` / `deleted`)

![Configuration 1/2 github]({{ '/assets/img/blog/10-esb-api-webhook/5-github-1.webp' | relative_url }}){:alt="Configuration 1/2 github" loading="lazy" decoding="async"}

![Configuration 2/2 github]({{ '/assets/img/blog/10-esb-api-webhook/5-github-2.webp' | relative_url }}){:alt="Configuration 2/2 github" loading="lazy" decoding="async"}

> ⚠️ Le **secret**, c’est ton mot de passe partagé avec GitHub : ne le hardcode pas n’importe où, et ne le loggue jamais.

---

## Modifier le job Talaxie : route GitHub + récupération du body brut

On ajoute une **nouvelle branche** (comme `webhook_test`), mais avec une différence critique :  
tu dois récupérer le **BODY en `byte[]`** (octets bruts), sans aucune transformation.

![Ajout d'une branche pour l'API Github]({{ '/assets/img/blog/10-esb-api-webhook/4-schema.webp' | relative_url }}){:alt="Ajout d'une branche pour l'API Github" loading="lazy" decoding="async"}

### Pourquoi le body doit être en `byte[]` (et pas en String/JSON “joli”) ?
GitHub signe ses webhooks avec le header **`X-Hub-Signature-256`** : c’est un **HMAC SHA-256 calculé sur le body HTTP brut**.

Donc côté serveur, tu dois :    
1) reprendre **exactement** les mêmes octets reçus,  
2) recalculer le HMAC avec le **secret**,  
3) comparer avec le header.

> ⚠️ **si tu modifies le payload avant la vérif** (reformat JSON, encodage, conversion String, etc.), tu changes les octets → la signature ne matchera plus.

---

La suite logique :
- une **routine Java** pour recalculer le HMAC SHA-256,
- un **tJava** pour comparer avec `X-Hub-Signature-256`,
- puis deux branches : **OK** (200) / **KO** (401).

---

## Routine Java : `GitHubSig`

Pour vérifier un webhook GitHub correctement, il te faut une routine qui fait **exactement** ça :    
1) reprendre le **body brut** (`byte[]`) tel qu’il a été reçu,
2) recalculer le **HMAC-SHA256** avec ton secret,
3) comparer (proprement) avec le header **`X-Hub-Signature-256`**.

> Règle non négociable : **tu vérifies d’abord, tu parses ensuite**.  
> Sinon tu te tires une balle dans le pied : signature invalide à cause d’un body modifié.

Crée une routine Java nommée **`GitHubSig`** (dans `Code > Routines`).

~~~java
package routines;

import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Routine Talend — Vérification de signature GitHub "X-Hub-Signature-256" (HMAC-SHA256)
 *
 * Contexte (GitHub Webhooks)
 * -------------------------
 * GitHub signe chaque webhook avec un secret partagé :
 *   signature = HMAC_SHA256(secret, raw_body_bytes)
 * et envoie le résultat dans le header HTTP :
 *   X-Hub-Signature-256: sha256=<hex_lowercase>
 *
 * Objectif de cette routine
 * -------------------------
 * - Recalculer la signature HMAC-SHA256 à partir du BODY brut (byte[]) + secret
 * - Comparer en temps constant avec la valeur transmise dans le header GitHub
 * - Retourner true/false
 *
 * Points critiques (à respecter absolument)
 * ----------------------------------------
 * 1) Il faut signer le BODY *brut* en bytes (byte[]) :
 *    - Ne pas parser/reformater le JSON
 *    - Ne pas convertir en String puis re-encoder
 *    - Le moindre octet différent => signature invalide
 *
 * 2) La comparaison doit être en temps constant :
 *    - Évite des fuites d'information (timing attacks)
 *
 * API (fonctions publiques)
 * -------------------------
 * - verifyXHubSignature256(payloadRaw, secret, headerValue) : boolean
 *     => La méthode à utiliser dans ton tJava.
 *
 * - hmacSha256Hex(payloadRaw, secret) : String
 *     => Calcule l'hex (lowercase) du HMAC-SHA256.
 *
 * - expectedHexFromHeader(headerValue) : String
 *     => Extrait l'hex depuis "sha256=<hex>" (ou renvoie tel quel).
 *
 * Comportement en cas d'erreur / données manquantes
 * ------------------------------------------------
 * - La vérification renvoie false si :
 *   - header absent / invalide
 *   - secret absent
 *   - payloadRaw null (on le traite comme vide, mais c'est en général un problème d'appel)
 *   - algo crypto indisponible (rare en Java standard)
 *
 * Sécurité / logs
 * ---------------
 * - Cette version "simplifiée" ne loggue rien (recommandé).
 * - Si tu dois diagnostiquer, loggue seulement des booléens/tailles, jamais le secret.
 */
public class GitHubSig {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final String PREFIX = "sha256=";

    /**
     * Vérifie le header GitHub "X-Hub-Signature-256".
     *
     * @param payloadRaw  BODY HTTP brut EXACT (byte[]). C'est la seule donnée signée par GitHub.
     * @param secret      Secret du webhook GitHub (String). Doit être identique à celui configuré côté GitHub.
     * @param headerValue Valeur brute du header "X-Hub-Signature-256" (ex: "sha256=<64hex>").
     * @return true si signature valide, false sinon.
     */
    public static boolean verifyXHubSignature256(byte[] payloadRaw, String secret, String headerValue) {
        if (secret == null || secret.isEmpty()) return false;

        String expected = expectedHexFromHeader(headerValue);
        if (expected == null || expected.length() != 64 || !isLowerHex(expected)) return false;

        String computed = hmacSha256Hex(payloadRaw, secret);
        return computed != null && constantTimeEquals(computed, expected);
    }

    /**
     * Calcule HMAC-SHA256(payloadRaw, secret) et renvoie le résultat en hex lowercase.
     *
     * @param payloadRaw BODY brut en bytes (null => tableau vide).
     * @param secret     Secret du webhook (null => chaîne vide, mais en pratique verify() bloque déjà).
     * @return hex lowercase (64 chars) ou null si erreur crypto.
     */
    public static String hmacSha256Hex(byte[] payloadRaw, String secret) {
        try {
            byte[] msg = (payloadRaw == null) ? new byte[0] : payloadRaw;
            byte[] key = (secret == null) ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);

            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(key, HMAC_ALGO));

            return toHexLower(mac.doFinal(msg));
        } catch (Exception e) {
            // Simplifié : pas de logs ici. Si tu dois diagnostiquer, remonte l'exception via un log contrôlé.
            return null;
        }
    }

    /**
     * Extrait l'hex depuis "sha256=<hex>".
     * - Accepte aussi "<hex>" si tu passes déjà la partie hex.
     * - Normalise en minuscules et trim.
     *
     * @param headerValue Valeur du header (peut être null).
     * @return hex lowercase (sans préfixe) ou null si header null.
     */
    public static String expectedHexFromHeader(String headerValue) {
        if (headerValue == null) return null;

        String v = headerValue.trim().toLowerCase();
        if (v.startsWith(PREFIX)) v = v.substring(PREFIX.length());

        return v;
    }

    // =========================
    // Helpers internes (privés)
    // =========================

    /** Vérifie que la chaîne ne contient que [0-9a-f] (hex lowercase). */
    private static boolean isLowerHex(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            boolean ok = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f');
            if (!ok) return false;
        }
        return true;
    }

    /** Convertit un byte[] en hex lowercase, sans allocations inutiles. */
    private static String toHexLower(byte[] bytes) {
        char[] hex = "0123456789abcdef".toCharArray();
        char[] out = new char[bytes.length * 2];

        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xFF;
            out[i * 2]     = hex[v >>> 4];
            out[i * 2 + 1] = hex[v & 0x0F];
        }
        return new String(out);
    }

    /**
     * Comparaison en temps constant (sur la longueur).
     * But : éviter que le temps de comparaison révèle où ça diverge.
     */
    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;

        int r = 0;
        for (int i = 0; i < a.length(); i++) {
            r |= a.charAt(i) ^ b.charAt(i);
        }
        return r == 0;
    }
}
~~~

---

## Vérifier la signature GitHub dans un `tJava`

Objectif : **refuser tout webhook dont la signature ne matche pas**.  
Tu récupères le **body brut (`byte[]`)** + le header **`X-Hub-Signature-256`**, tu appelles `GitHubSig`, et tu poses un booléen `b_IsGithubTokenOk` pour piloter les branches.

Le code du tJava   

~~~java
/**
 * tJava (Talaxie) — Vérification de la signature GitHub "X-Hub-Signature-256"
 *
 * Objectif
 * --------
 * Valider que le corps HTTP reçu (raw body) correspond bien à la signature HMAC-SHA256
 * envoyée par GitHub via le header "X-Hub-Signature-256".
 *
 * Pré-requis / Hypothèses
 * -----------------------
 * 1) Ce tJava s'exécute dans un Job exposé via REST (Talaxie ESB / CXF) avec :
 *    - globalMap.get("restRequest") : Map contenant les infos de la requête
 *    - rr.get("ALL_HEADER_PARAMS")  : MultivaluedMap<String,String> des headers HTTP
 *    - rr.get("BODY")              : byte[] = corps brut (RAW) de la requête
 *
 * 2) Le secret est disponible dans le contexte :
 *    - context.mon_secret : String (doit être non null / non vide)
 *
 * 3) Tu as une routine utilitaire "routines.GitHubSig" qui fournit :
 *    - hmacSha256Hex(byte[] body, String secret) : calcule l'hex HMAC SHA-256
 *    - expectedHexFromHeader(String sigHeader)   : extrait l'hex depuis "sha256=..."
 *    - verifyXHubSignature256(byte[] body, String secret, String sigHeader) : vérifie en bool
 *
 * Effets de bord
 * --------------
 * - Positionne context.b_IsGithubTokenOk (Boolean) :
 *     true  => signature valide
 *     false => signature absente / invalide / données manquantes
 *
 * Remarques sécurité
 * ------------------
 * - Ne loggue pas le secret.
 * - Évite de logguer le body complet (risque données sensibles).
 * - Si tu es derrière un reverse-proxy, la signature doit porter sur le BODY brut exact
 *   (pas un body modifié, ni reformaté, ni re-encodé).
 */

// 1) Récupérer la requête REST depuis globalMap
java.util.Map<String, Object> rr =
    (java.util.Map<String, Object>) globalMap.get("restRequest");

// 2) Récupérer le header de signature GitHub
javax.ws.rs.core.MultivaluedMap<String, String> headers =
    (javax.ws.rs.core.MultivaluedMap<String, String>) rr.get("ALL_HEADER_PARAMS");

String sigHeader = (headers == null) ? null : headers.getFirst("X-Hub-Signature-256");

// 3) Récupérer le body RAW (indispensable : la signature GitHub est calculée dessus)
byte[] rawBody = (rr == null) ? null : (byte[]) rr.get("BODY");

// 4) Vérifier (retourne false si il manque un élément critique)
context.b_IsGithubTokenOk =
    (rawBody != null)
    && (context.mon_secret != null && !context.mon_secret.isEmpty())
    && (sigHeader != null && !sigHeader.isEmpty())
    && routines.GitHubSig.verifyXHubSignature256(rawBody, context.mon_secret, sigHeader);

// 5) Logs minimaux (diagnostic sans fuite de secret / données)
System.out.println(
    "GitHub signature check: ok=" + context.b_IsGithubTokenOk
    + " bodyLen=" + (rawBody == null ? -1 : rawBody.length)
    + " sigPresent=" + (sigHeader != null && !sigHeader.isEmpty())
    + " secretPresent=" + (context.mon_secret != null && !context.mon_secret.isEmpty())
);
~~~

---

## Variables de contexte + branchement sur la signature

Le `tJava` utilise deux variables de contexte :

- `mon_secret` : ton secret GitHub (`TON_SECRET_TRES_LONG_POUR_GITHUB`)
- `b_IsGithubTokenOk` : booléen initialisé à `false`

Puis tu branches sur `b_IsGithubTokenOk` :

- `true` : signature valide → traitement normal + **200**
- `false` : signature invalide/absente → rejet + **401**

---

## Cas `b_IsGithubTokenOk = true` (signature valide)

Ici tu peux enfin lire le JSON.  
On extrait quelques infos utiles :

- `action` : `created` ou `deleted`
- `starred_at` : date/heure
- `sender.login` : utilisateur GitHub

### 1) Convertir le body brut en `String` 

Ajoute un `tFixedFlowInput` avec une colonne `body` (String) et comme valeur :

~~~java
new String(((byte[])globalMap.get("webhook_github.body")), "UTF-8")
~~~

> Adapte la valeur `webhook_github` en fonction du nom de ta connexion main issue du tRestRequest ! 

### 2) Extraire les champs (tExtractJSONFields)

Configure `tExtractJSONFields` sur la colonne `body`.

![Configuration du tExtractJSONFields]({{ '/assets/img/blog/10-esb-api-webhook/6-tExtractJSONFIelds.webp' | relative_url }}){:alt="Configuration du tExtractJSONFields" loading="lazy" decoding="async"}

### 3) Observer + répondre 200

- `tLogRow` après `tExtractJSONFields`
- puis `tRestResponse` dans un sous-job qui renvoie **200 OK**

![Affichage du resultat, et renvoi d'un code 200]({{ '/assets/img/blog/10-esb-api-webhook/6-tExtractJSONFIelds-2.webp' | relative_url }}){:alt="Affichage du resultat, et renvoi d'un code 200" loading="lazy" decoding="async"}

---

## Cas `b_IsGithubTokenOk = false` (signature invalide)

Ici, pas de débat : si la signature ne matche pas, tu rejettes.

- Log minimal via `tWarn`, juste pour indiquer que tu es passé dans cette branche.
- `tRestResponse` avec **401 Unauthorized**

![Gestion des erreurs, et renvoi d'un code 401]({{ '/assets/img/blog/10-esb-api-webhook/7-gestion-erreurs.webp' | relative_url }}){:alt="Gestion des erreurs, et renvoi d'un code 401" loading="lazy" decoding="async"}

---

## Modification du Caddyfile (ajout de la route GitHub)

Tu as déjà `/webhook/test`. Maintenant tu ajoutes `/webhook/github`.

Idée simple :
- **Caddy fait un contrôle minimal** : POST only + signature présente
- **Talaxie fait le vrai contrôle** : recalcul HMAC sur body brut

> Remplace :
> - `TON_DOMAINE.duckdns.org` par ton domaine
> - `TON_SECRET_TRES_LONG` par ton token du webhook test

~~~t
{
	# ============================================
	# CONFIG GLOBALE CADDY
	# ============================================
	# Décommente temporairement si tu dois diagnostiquer Caddy.
	# ⚠️ Très verbeux en prod.
	# debug

	# Optionnel : email pour ACME/Let's Encrypt (utile pour alertes)
	# email toi@example.com
}

# =========================================================
# 1) PORT 80 : redirection HTTP -> HTTPS UNIQUEMENT
#    pour le domaine attendu, sinon 404 (anti-scan)
# =========================================================
:80 {
	# Autorise uniquement le host prévu (évite que le serveur réponde
	# à des hosts "au hasard" lors de scans)
	@duck host TON_DOMAINE.duckdns.org

	# Redirection permanente vers HTTPS en conservant host + URI
	redir @duck https://{host}{uri} permanent

	# Tout le reste => 404 (stealth/anti-scan)
	respond 404
}

# =========================================================
# 2) SITE HTTPS PRINCIPAL
# =========================================================
TON_DOMAINE.duckdns.org {

	# ---------------------------------------------------------
	# Compression (utile sur JSON/XML; pas critique sur petits payloads)
	# ---------------------------------------------------------
	encode gzip

	# ---------------------------------------------------------
	# Logs d'accès en JSON dans un fichier dédié
	# - Pratique pour parser/grep/ingérer dans ELK/Loki
	# - Le status 404 est attendu sur les URLs non gérées (fallback)
	# ---------------------------------------------------------
	log {
		output file /var/log/caddy/webhook-access.log
		format json
	}

	# ---------------------------------------------------------
	# Headers HTTP de sécurité "de base"
	# ---------------------------------------------------------
	header {
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "no-referrer"

		# Optionnel : HSTS (force HTTPS côté navigateur)
		# ⚠️ À activer uniquement si tu es sûr de servir en HTTPS durablement.
		# Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
	}

	# =========================================================
	# 3) WEBHOOK TEST (CUSTOM) — Token simple
	#
	# URL publique      : POST https://TON_DOMAINE.duckdns.org/webhook/test
	# Service interne   : http://127.0.0.1:8088/services/webhook/test
	#
	# Objectifs :
	# - N'accepter QUE POST
	# - Protéger via header X-Webhook-Token (secret statique)
	# - Réécrire l'URL publique -> endpoint Talend/CXF
	# - Reverse proxy vers Talend Runtime local (port 8088)
	# =========================================================

	# --- (3.1) Match sur le chemin public ---
	@wh_test path /webhook/test

	# --- (3.2) Méthodes non autorisées ---
	@wh_test_badmethod {
		path /webhook/test
		not method POST
	}
	handle @wh_test_badmethod {
		respond 405
	}

	# --- (3.3) Token manquant ou incorrect ---
	# Remplace TON_SECRET_TRES_LONG par une valeur longue + aléatoire.
	@wh_test_badtoken {
		path /webhook/test
		not header X-Webhook-Token "TON_SECRET_TRES_LONG"
	}
	handle @wh_test_badtoken {
		respond 401
	}

	# --- (3.4) OK : POST + token correct ---
	handle @wh_test {
		# Réécriture pour coller au mapping Talend/CXF
		rewrite * /services/webhook/test

		# Proxy vers Talend
		reverse_proxy 127.0.0.1:8088 {
			# On force "localhost" pour que CXF ne se base pas sur le host public
			header_up Host localhost:8088
			header_up X-Forwarded-Host localhost:8088
			header_up X-Forwarded-Proto http

			# Optionnel : transmettre l'IP client explicitement
			# header_up X-Real-IP {remote_host}
		}
	}

	# =========================================================
	# 4) WEBHOOK GITHUB — Signature X-Hub-Signature-256
	#
	# URL publique      : POST https://TON_DOMAINE.duckdns.org/webhook/github
	# Service interne   : http://127.0.0.1:8088/services/webhook/github
	#
	# Objectifs :
	# - N'accepter QUE POST
	# - Exiger la présence du header GitHub "X-Hub-Signature-256"
	#   (la vérification cryptographique se fait dans Talend, pas dans Caddy)
	# - Réécrire l'URL publique -> endpoint Talend/CXF
	# - Reverse proxy vers Talend Runtime local (port 8088)
	#
	# Note importante :
	# - Caddy NE vérifie PAS la HMAC ici (pas nativement).
	# - Il fait un "gate" minimal : signature présente => on forward vers Talend.
	# - Talend calcule/compare la signature à partir du BODY brut.
	# =========================================================

	# --- (4.1) Match sur le chemin GitHub ---
	@wh_github path /webhook/github

	# --- (4.2) Méthodes non autorisées ---
	@wh_github_badmethod {
		path /webhook/github
		not method POST
	}
	handle @wh_github_badmethod {
		respond 405
	}

	# --- (4.3) Signature absente ---
	# GitHub envoie X-Hub-Signature-256 si un "Secret" est défini dans l'UI GitHub Webhooks.
	@wh_github_nosig {
		path /webhook/github
		not header X-Hub-Signature-256 *
	}
	handle @wh_github_nosig {
		respond 401
	}

	# --- (4.4) OK : POST + header de signature présent ---
	handle @wh_github {
		# Réécriture pour coller à l'endpoint Talend/CXF
		rewrite * /services/webhook/github

		# Proxy vers Talend
		reverse_proxy 127.0.0.1:8088 {
			# Même logique : éviter que CXF "croie" qu'il est exposé en public
			header_up Host localhost:8088
			header_up X-Forwarded-Host localhost:8088
			header_up X-Forwarded-Proto http

			# Headers "observabilité" : conserver contexte original pour logs Talend
			header_up X-Original-Host {host}
			header_up X-Original-URI {uri}

			# Optionnel : IP client explicite
			# header_up X-Real-IP {remote_host}
		}
	}

	# =========================================================
	# 5) FALLBACK : tout ce qui n'est pas explicitement géré
	# =========================================================
	respond 404
}
~~~

---

## Redéployer dans Karaf et mise à jour du bundle

Tu as modifié ton job : rebuild + mise à jour du bundle.

### Étape 1 — Rebuild + copie dans `deploy`
- Rebuild le job (bundle OSGi)
- Recopie le `.jar` dans `/container/deploy`

### Étape 2 — Mettre à jour le bundle dans Karaf

1) Récupère l’ID :
~~~sh
bundle:list
~~~

2) Rafraîchis (wiring/dépendances OSGi) :
~~~sh
bundle:refresh ID
~~~

3) Redémarre :
~~~sh
bundle:restart ID
~~~

![Redéploiement dans le container Karaf (Runtime_ESBSE)]({{ '/assets/img/blog/10-esb-api-webhook/8-deploiement-karaf.webp' | relative_url }}){:alt="Redeploiement dans le container Karaf (Runtime_ESBSE)" loading="lazy" decoding="async"}

---

## Test (cette fois, c’est GitHub qui doit appeler)

Postman ne suffit pas “tel quel” : GitHub ajoute la signature `X-Hub-Signature-256`.  
Donc tu testes en déclenchant un vrai événement.

### Test rapide    

1) Mets une étoile sur ton repo    
2) Retire l’étoile    
3) Regarde les logs côté Karaf : `action = created` puis `deleted`    

![Ajouter une étoile sur GitHub]({{ '/assets/img/blog/10-esb-api-webhook/9-test-github.webp' | relative_url }}){:alt="Ajouter une etoile sur github" loading="lazy" decoding="async"}

![Résultat du webhook côté Karaf]({{ '/assets/img/blog/10-esb-api-webhook/9-resultats.webp' | relative_url }}){:alt="Resultat du webhook" loading="lazy" decoding="async"}

> Astuce : dans **Settings → Webhooks → Recent deliveries**, tu peux “redeliver” pour retester rapidement après un ajustement.

### Si ça ne marche pas
- **401 côté Caddy** : header `X-Hub-Signature-256` absent → secret non défini côté GitHub ou mauvaise route
- **401 côté Talaxie** : signature invalide → secret différent, ou body modifié avant la vérif

---

# Partie 2 ? 
> ✅ **La partie 2 est en ligne : Webhook signé (HMAC) côté émetteur**  
> Tu y apprends à **générer** la signature HMAC-SHA256, poser `X-Signature-256`, puis appeler ton endpoint Talaxie avec `tRESTClient`.  
> 👉 [https://bmdata.fr/blog/API-et-Webhook-talaxie-esb-2/](https://bmdata.fr/blog/API-et-Webhook-talaxie-esb-2/)

# Conclusion

Tu as maintenant un chemin complet :
- endpoint REST dans Talaxie (`tRESTRequest` / `tRESTResponse`)
- déploiement Karaf (bundle OSGi)
- exposition HTTPS via Caddy
- webhook GitHub avec vérification HMAC (`X-Hub-Signature-256`)

Ce lab est un **POC pédagogique** : il montre la mécanique, pas une prod “internet-proof” sans durcissement.

---

# FAQ

**1) “Un webhook, c’est une API ?”**  
C’est du HTTP comme une API, mais la logique est inverse : **API = tu demandes**, **webhook = on te pousse l’info**.  
Donc tu ne gères pas le “rythme” : c’est toi qui dois encaisser.

**2) “Pourquoi tu conseilles webhook + API derrière ?”**  
Webhook = *signal* (un truc vient d’arriver).  
API = *enrichissement* (tu vas chercher les détails quand tu en as besoin).  
Ça réduit le bruit et ça évite le polling.

**3) “Pourquoi Caddy + Talaxie/Talend plutôt que Karaf exposé direct ?”**  
Parce que tu centralises :
- HTTPS (TLS),
- routing,
- filtres simples (host/méthode/headers),
- logs d’accès.  
Et tu évites de publier ton runtime en frontal.

**4) “Le filtre ‘header présent’ dans Caddy, ça sécurise vraiment ?”**  
Non. Ça fait juste un **garde-barrière** minimal (anti bruit/anti scans).  
La vraie sécurité, c’est la **vérification HMAC côté Talaxie**.

**5) “Pourquoi GitHub insiste sur `X-Hub-Signature-256` ?”**  
Parce qu’un header se forge.  
La signature HMAC prouve que l’émetteur connaît le secret, *et* que le body n’a pas été modifié.

**6) “`X-Hub-Signature` vs `X-Hub-Signature-256` : je prends quoi ?”**  
Pour un POC moderne : `X-Hub-Signature-256` (SHA-256).  
`X-Hub-Signature` (SHA-1) est l’ancien format.

**7) “Pourquoi tu répètes ‘body brut’ ?”**  
Parce que la signature est calculée sur **les octets exacts** du body HTTP.  
Tu modifies (pretty JSON, conversion String, encodage…) → signature KO.

**8) “GitHub renvoie les webhooks si je réponds 500 ?”**  
Oui : si tu ne réponds pas correctement, il y a des retries/redeliver.  
Le bon réflexe : répondre vite (2xx si accepté), et traiter ensuite si besoin (queue) — même en POC, garde ça en tête.

**9) “Quel code HTTP je dois renvoyer à GitHub ?”**  
- **200/204** : accepté  
- **401** : rejet (signature invalide)  
- **4xx/5xx** : GitHub peut considérer la livraison comme échouée (et retenter).

**10) “Et si mon traitement est long ?”**  
Réponds **vite** (accusé réception), puis traite derrière (file/queue).  
Même en POC, c’est la différence entre “ça marche 1 fois” et “ça marche quand ça spike”.

**11) “Comment je gère les doublons proprement ?”**  
GitHub fournit un identifiant de livraison (`X-GitHub-Delivery`).  
Stratégie simple :
- tu loggues l’ID,
- tu stockes les IDs déjà traités (même dans un fichier/redis/db en version “lite”),
- si tu revois le même ID → tu ignores.

**12) “Je peux whitelister les IP GitHub ?”**  
Oui (et c’est une bonne défense réseau), mais ça demande de tenir la liste à jour.  
En POC, tu peux le noter comme amélioration.

**13) “Comment je débogue un 401 Talaxie sans fuite ?”**  
Loggue uniquement :
- `bodyLen`,
- `sigPresent`,
- éventuellement les **premiers caractères** du header (pas le secret),
- et un ID de corrélation.  
Ne loggue jamais le secret.

**14) “Je peux tester la signature GitHub sans GitHub ?”**  
Oui, mais il faut calculer l’HMAC côté client et envoyer le header `X-Hub-Signature-256`.  
En POC, c’est utile pour valider ton code, mais le test “réel” reste GitHub → Recent deliveries.


---

# Liens utiles 

## Sources

- [GitHub — Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [GitHub — Webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
- [GitHub — Troubleshooting webhooks](https://docs.github.com/fr/enterprise-cloud@latest/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks)
- [Caddy — reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Caddy — rewrite](https://caddyserver.com/docs/caddyfile/directives/rewrite)
- [Talend (Qlik Help) — ESB REST components](https://help.qlik.com/talend/en-US/components/8.0/esb-rest/esb-rest-component)

## Liens pour le tuto : 
- Le projet complet : [Téléchargement](https://github.com/mbodetdata/BMDATA_Blog-webhook)
- Java (Zulu) : [Téléchargement](https://www.azul.com/downloads/?package=jdk#zulu)
- Caddy : [Téléchargement](https://caddyserver.com/download)
- Talaxie : [Téléchargement](https://deilink.fr/#/download)
- Runtime_ESBSE : [Téléchargement](https://github.com/mbodetdata/BMDATA_Runtime_ESBSE_Talend-Talaxie)
