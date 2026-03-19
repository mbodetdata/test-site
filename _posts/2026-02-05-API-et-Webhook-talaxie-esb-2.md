---
layout: post
title: "Partie 2 — Webhook signé : générer une signature HMAC côté Talaxie et l’envoyer proprement"
description: "Après la vérification côté serveur (partie 1), tu passes côté émetteur : construire un JSON, calculer une signature HMAC SHA-256 sur le body brut, poser X-Signature-256, puis appeler ton endpoint webhook Talaxie via tRESTClient."
categories: blog
tags: [Webhook, HMAC, Talaxie ESB, Karaf, Sécurité, tRESTClient, JSON]
image: "/assets/img/blog/11-esb-api-webhook-partie-2/logo_1024.webp"
active: true
parent_category: data
category_label: ESB
---

# Introduction — Tu passes côté émetteur

Dans la **partie 1**, tu as mis en place la réception d’un webhook sécurisé :

- exposer un endpoint REST avec `tRESTRequest`
- déployer dans Karaf (Runtime_ESBSE)
- exposer via Caddy
- vérifier une **signature HMAC-SHA256**
- refuser toute requête invalide (**401**)

Bref : tu sais **recevoir** un webhook et valider son intégrité.

👉 Si tu n’as pas suivi la partie 1, fais-la avant de continuer :  
[API vs Webhook : comprendre la différence et implémenter un webhook sécurisé avec Talaxie](https://bmdata.fr/blog/API-et-Webhook-talaxie-esb/)

📦 Workspace (projet) disponible ici : [https://github.com/mbodetdata/BMDATA_Blog-webhook](https://github.com/mbodetdata/BMDATA_Blog-webhook)

La partie 2 s’appuie directement dessus : ici, tu vas **émettre** le webhook, donc **produire** la signature.

---

# Générer et signer un webhook avec Talaxie

Maintenant, tu changes de rôle.

Jusqu’ici, tu **vérifiais** une signature côté serveur.  
Ici, tu vas **la générer** côté émetteur.

## Convention utilisée dans cet article

On utilise une convention simple (inspirée des webhooks “classiques”, mais adaptée à ton besoin) :

- **Header** : `X-Signature-256`
- **Format** : `sha256=<hex>`
- **Signature** : HMAC-SHA256 calculée sur le **body brut (bytes)**

## Ce que tu vas faire (pas à pas)

- construire un JSON simple (`id`, `nom`, `prenom`, `date`)
- calculer la signature HMAC sur le **body brut (bytes)**
- ajouter le header `X-Signature-256: sha256=<hex>`
- envoyer la requête via `tRESTClient`

## Résultat

À la fin, tu as le cycle complet :

- Partie 1 → réception + vérification  
- Partie 2 → émission + signature  

---

## Ce que tu vas construire

Tu vas créer **deux jobs** :

### 1) Job `Receveur`
- duplication du job de la partie 1
- version simplifiée pour ce lab : une route, un schéma minimal, et la vérification HMAC

### 2) Job `Emetteur`
C’est lui qui fabrique et envoie le webhook. Il va :

- construire un JSON simple (`id`, `nom`, `prenom`, `date`)
- calculer une **signature HMAC-SHA256** sur le **body brut (bytes)**
- construire le header : `X-Signature-256: sha256=<hex>`
- appeler l’endpoint exposé par `Receveur` via `tRESTClient`

---

## Rappel : ce que prouve HMAC (et ce que ça ne prouve pas)

[HMAC (RFC 2104)](https://datatracker.ietf.org/doc/html/rfc2104) est un mécanisme d’authentification basé sur un **secret partagé**.

### HMAC garantit
- **Intégrité** : le message n’a pas été modifié
- **Authenticité** : l’émetteur connaît le secret

### HMAC ne garantit pas
- **Confidentialité** : ce n’est **pas** du chiffrement
- **Anti-rejeu** : à lui seul, HMAC n’empêche pas qu’une requête valide soit rejouée (*replay*)

---

## Architecture du lab

**Flux cible :**

[Job Talaxie — `Emetteur`]  
&nbsp;&nbsp;&nbsp;&nbsp;↓ `POST` JSON + `X-Signature-256: sha256=<hex>`  
[Job Talaxie — `Receveur`]

Tu peux exécuter les deux :
- sur le **même runtime** (lab rapide),
- sur **deux runtimes** séparés,
- via **Caddy en HTTPS** (comme en partie 1).

> Dans cet article, on reste volontairement simple : on lance les deux jobs dans le même Studio.  
> Mais garde en tête que, comme en partie 1, tu peux ensuite déployer sur un runtime ou un conteneur si tu veux te rapprocher d’un vrai contexte de prod.

---

## Prérequis

Pour cette partie 2, tu vas réutiliser le principe de la partie 1, mais en ajoutant une routine plus **générique**, utilisable à la fois pour :

- **générer** une signature HMAC côté `Emetteur`,
- **vérifier** la signature côté `Receveur`.

### Ce que tu fais

1) Crée une nouvelle routine Talend nommée **`HmacSig`**  
2) Copie-colle le code ci-dessous tel quel

### Ce que cette routine apporte

- calcule une signature : `HMAC(algo, secret, raw_body_bytes)`
- renvoie la signature en **hex lowercase**
- gère le format avec préfixe, par exemple : `sha256=<hex>`
- fournit une vérification avec comparaison **en temps constant**

### Point critique à retenir (sinon ça ne marchera jamais)

Tu dois signer les **bytes bruts** du body envoyé.  
Pas une version “reformatée” du JSON, pas un JSON re-sérialisé : **exactement** ce qui part sur l'endpoint.

~~~java

package routines;

import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Routine Talend — Signature & vérification HMAC (générique)
 *
 * Principe
 * --------
 * signature = HMAC(algo, secret, raw_body_bytes)
 * La signature est souvent transportée en hex dans un header, parfois préfixée (ex: "sha256=<hex>").
 *
 * Points critiques
 * ---------------
 * - On signe les BYTES bruts envoyés (pas de reformat JSON, pas de parse/re-encode).
 * - Comparaison en temps constant.
 * - Pas de logs du secret.
 */
public class HmacSig {

    public static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Calcule HMAC(message, secret) avec l'algo demandé, renvoie hex lowercase.
     */
    public static String hmacHex(byte[] messageRaw, String secret, String hmacAlgo) {
        try {
            byte[] msg = (messageRaw == null) ? new byte[0] : messageRaw;
            byte[] key = (secret == null) ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);

            Mac mac = Mac.getInstance(hmacAlgo);
            mac.init(new SecretKeySpec(key, hmacAlgo));

            return toHexLower(mac.doFinal(msg));
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Raccourci HMAC-SHA256 => hex lowercase (64 chars).
     */
    public static String hmacSha256Hex(byte[] messageRaw, String secret) {
        return hmacHex(messageRaw, secret, HMAC_SHA256);
    }

    /**
     * Construit une valeur de header type "<prefix><hex>".
     * Exemple: prefix="sha256=" => "sha256=<64hex>"
     * Si prefix est null => renvoie juste "<hex>".
     */
    public static String buildSignatureValue(byte[] messageRaw, String secret, String prefix) {
        String hex = hmacSha256Hex(messageRaw, secret);
        if (hex == null) return null;
        return (prefix == null) ? hex : (prefix + hex);
    }

    /**
     * Vérifie une signature hex (avec éventuellement un prefix dans le header).
     *
     * @param messageRaw  bytes EXACTS qui ont été signés
     * @param secret      secret partagé
     * @param provided    valeur reçue (ex: "sha256=<hex>" ou "<hex>")
     * @param prefix      prefix attendu (ex: "sha256=") ou null si pas de prefix
     */
    public static boolean verifySha256(byte[] messageRaw, String secret, String provided, String prefix) {
        if (secret == null || secret.isEmpty()) return false;

        String expectedHex = extractHex(provided, prefix);
        if (expectedHex == null || expectedHex.length() != 64 || !isHex(expectedHex)) return false;

        String computedHex = hmacSha256Hex(messageRaw, secret);
        if (computedHex == null) return false;

        // Normalisation en lowercase pour comparaison
        expectedHex = expectedHex.toLowerCase();
        return constantTimeEquals(computedHex, expectedHex);
    }

    /**
     * Extrait la partie hex d'une valeur possiblement préfixée.
     * - Trim
     * - Si prefix non null et trouvé, on le retire (case-insensitive)
     * - Renvoie le reste tel quel
     */
    public static String extractHex(String provided, String prefix) {
        if (provided == null) return null;

        String v = provided.trim();
        if (prefix != null && !prefix.isEmpty()) {
            // comparaison prefix case-insensitive
            if (v.length() >= prefix.length() && v.substring(0, prefix.length()).equalsIgnoreCase(prefix)) {
                v = v.substring(prefix.length());
            }
        }
        return v.trim();
    }

    // =========================
    // Helpers internes
    // =========================

    private static boolean isHex(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            boolean ok =
                (c >= '0' && c <= '9') ||
                (c >= 'a' && c <= 'f') ||
                (c >= 'A' && c <= 'F');
            if (!ok) return false;
        }
        return true;
    }

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

# Créer un job `Receveur`

L’objectif de ce job est simple : **recevoir** le webhook et **vérifier** la signature HMAC, comme en partie 1 — mais avec un setup minimal pour le lab.

## Étape 1 — Dupliquer le job de la partie 1

1) Duplique le job créé en partie 1.  
2) Garde uniquement **une seule route / une seule branche**.  
3) Renomme le job en **`Receveur`**.

![tRestRequest - Une seule route]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/1-receveur-trestrequest.webp' | relative_url }}){:alt="tRESTRequest, une route, le webhook Talaxie" loading="lazy" decoding="async"}

### Point important : le schéma du `tRESTRequest`

Tu dois récupérer le **body brut** dans le flux.  
Concrètement : ajoute une colonne **`body`** de type **tableau de bytes** (`byte[]`).

C’est indispensable, parce que la signature HMAC doit être calculée sur ces **bytes exacts**.

![tRestRequest - Une seule route]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/1-receveur-trestrequest-schema.webp' | relative_url }}){:alt="tRESTRequest, une route, le webhook Talaxie" loading="lazy" decoding="async"}

## Étape 2 — Adapter le `tJava` (vérification de signature)

Dans la partie 1, tu avais déjà une vérification HMAC côté serveur.  
Ici, l’idée est simplement de **basculer sur la routine `HmacSig`**.

### Objectif de cette étape

- lire la valeur du header **`X-Signature-256`**
- récupérer le **body brut** (`byte[]`)
- vérifier : `sha256=<hex>` correspond bien à `HMAC-SHA256(secret, bodyBytes)`
- stocker le résultat dans `context.b_IsTokenOk` (pour router ensuite sur 200 / 401)

### À faire

1) Ouvre ton composant `tJava` dans le job **`Receveur`**  
2) Remplace le contenu par le code ci-dessous (copier-coller tel quel)

> La vérification doit se faire sur `rr.get("BODY")` (bytes bruts).

> Il te faudra importer, dans les paramètres avancés du composant `tJava`, la bibliothèque suivante :
 ~~~java
import java.nio.charset.StandardCharsets;
~~~

> Note : dans ce lab, on récupère `restRequest` et on lit `ALL_HEADER_PARAMS` / `BODY`. Si, chez toi, les clés diffèrent, inspecte `globalMap` via un `tJava` de debug et adapte.

~~~ java

/**
 * tJava (Talend) — Vérification de signature HMAC-SHA256 (générique)
 *
 * Objectif
 * --------
 * Valider que le corps HTTP reçu (raw body) correspond bien à la signature HMAC-SHA256
 * envoyée via un header (ex: "X-Signature-256").
 *
 * Hypothèses (Talend REST / CXF)
 * -----------------------------
 * - globalMap.get("restRequest") : Map contenant les infos de la requête
 * - rr.get("ALL_HEADER_PARAMS")  : MultivaluedMap<String,String> des headers HTTP
 * - rr.get("BODY")              : byte[] = corps brut (RAW) de la requête
 *  Dans ce lab, on récupère restRequest et on lit ALL_HEADER_PARAMS / BODY. Si chez toi les clés diffèrent, inspecte globalMap via un tJava de debug et adapte.
 *
 * Contexte
 * --------
 * - context.mon_secret : String (non null / non vide)
 *
 * Sécurité
 * --------
 * - Ne pas logguer le secret
 * - Ne pas logguer le body complet
 *
 * Je l'ai fait ici, simplement pour faciliter la procédure du job
 */

// 1) Récupérer la requête REST depuis globalMap
java.util.Map<String, Object> rr =
    (java.util.Map<String, Object>) globalMap.get("restRequest");

// 2) Récupérer les headers
javax.ws.rs.core.MultivaluedMap<String, String> headers =
    (rr == null) ? null : (javax.ws.rs.core.MultivaluedMap<String, String>) rr.get("ALL_HEADER_PARAMS");

// >>>> PARAMS À PERSONNALISER <<<<
final String SIG_HEADER_NAME = "X-Signature-256"; 
final String SIG_PREFIX      = "sha256=";         // mets null si ton header contient uniquement le hex
// <<<< --------------------- >>>>

String sigHeader = (headers == null) ? null : headers.getFirst(SIG_HEADER_NAME);

// 3) Récupérer le body RAW (indispensable : on signe les bytes bruts)
byte[] rawBody = (rr == null) ? null : (byte[]) rr.get("BODY");

// 4) Vérifier
context.b_IsTokenOk =
    (rawBody != null)
    && (context.webhookSecret != null && !context.webhookSecret.isEmpty())
    && (sigHeader != null && !sigHeader.isEmpty())
    && routines.HmacSig.verifySha256(rawBody, context.webhookSecret, sigHeader, SIG_PREFIX);

// 5) Logs minimaux (diagnostic sans fuite)
System.out.println(
    "Signature check: ok=" + context.b_IsTokenOk
    + " bodyLen=" + (rawBody == null ? -1 : rawBody.length)
    + " sigHeaderName=" + SIG_HEADER_NAME
    + " sigPresent=" + (sigHeader != null && !sigHeader.isEmpty())
    + " secretPresent=" + (context.webhookSecret != null && !context.webhookSecret.isEmpty())
);
~~~

## Étape 3 — Adapter le `tExtractJSONFields`

Dernière étape côté `Receveur` : adapter l’extraction JSON.

En partie 1, tu traitais un payload GitHub.  
Ici, le payload vient de ton job `Emetteur`, donc les champs à extraire changent.

### Objectif
Extraire depuis le body JSON les 4 champs suivants :

- `id`
- `nom`
- `prenom`
- `date`

### À faire
1) Ouvre le composant **`tExtractJSONFields`**  
2) Modifie le mapping pour récupérer ces 4 champs.

![tExtractJSONFields - Modification des champs a recuperer]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/1-textractjsonfield.webp' | relative_url }}){:alt="tExtractJSONFields - Modification des champs a recuperer" loading="lazy" decoding="async"}

> À ce stade, ton job `Receveur` est prêt : il reçoit un POST, vérifie `X-Signature-256`, puis parse le JSON si la signature est valide.

---

# Créer un job `Emetteur`

Maintenant que `Receveur` est prêt, tu vas construire `Emetteur`.

Son rôle est volontairement minimal : il **fabrique** une requête valide, la **signe**, puis l’**envoie**.

## Ce que doit faire le job (et uniquement ça)

1) Construire le JSON (payload)  
2) Calculer la signature HMAC  
3) Appeler l’endpoint du `Receveur`

---

## Étape 1 — Construire le JSON (payload)

On part sur un payload très simple, avec 4 champs :

- `id`
- `nom`
- `prenom`
- `date`

### 1) Créer les données d’entrée (`tFixedFlowInput`)
Ajoute un **`tFixedFlowInput`** pour générer une ligne contenant ces valeurs.

![tFixedFlowInput - Création des données brutes]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/2-tfixedflowinput.webp' | relative_url }}){:alt="tFixedFlowInput - Création des données brutes" loading="lazy" decoding="async"}

### 2) Générer le JSON (`tWriteJSONFields`)
Ensuite, utilise un **`tWriteJSONFields`** pour construire le JSON à partir de ces données.

Objectif : obtenir un JSON qui sera envoyé **tel quel** au `Receveur`.

![tWriteJSONFields - Création du JSON]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/2-twritejsonfields.webp' | relative_url }}){:alt="tWriteJSONFields - Création du JSON" loading="lazy" decoding="async"}

---

## Étape 2 — Calculer la signature HMAC-SHA256

Ici, tu signes le payload avant de l’envoyer.  
La signature doit être calculée sur le **body brut (bytes)** : exactement ce qui sera envoyé au `Receveur`.

### Rappel du principe

1) Convertir le JSON en **bytes UTF-8**  
2) Calculer `HMAC-SHA256(secret, bodyBytes)`  
3) Encoder le résultat en **hex lowercase**  
4) Construire la valeur finale : `sha256=<hex>`

Java fournit tout ce qu’il faut via `javax.crypto.Mac` [doc Oracle](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/javax/crypto/Mac.html)

La routine **`HmacSig`** encapsule déjà ces étapes.  
Il te reste à l’appeler depuis `Emetteur` :

> Copie colle ce code, et ajoute le dans le `tJava`

~~~java

/**
 * tJava (Talend) — Génération d'une signature HMAC-SHA256 pour appel webhook
 *
 * Objectif
 * --------
 * - Construire un payload (String) qui sera envoyé tel quel
 * - Calculer la signature HMAC-SHA256 sur les bytes UTF-8 de ce payload
 * - Stocker payload + signature dans globalMap pour tRESTClient
 *
 * Contexte
 * --------
 * - context.webhookSecret : String (secret partagé)
 * - context.webhookUrl    : String (url cible) => utilisée dans tRESTClient
 *
 * Sorties (globalMap)
 * -------------------
 * - globalMap["webhook_payload"] : String
 * - globalMap["webhook_sig"]     : String (ex: "sha256=<hex>")
 */



// >>>> PARAMS À PERSONNALISER <<<<
final String SIG_PREFIX = "sha256=";          // mets null si tu veux envoyer uniquement le hex
final String SIG_HEADER_NAME = "X-Signature-256"; // utile si tu veux aussi le stocker
// <<<< --------------------- >>>>

// 1) Payload EXACT (une seule source de vérité)
// Exemple simple. Si tu as déjà un JSON en entrée, utilise-le tel quel (sans reformat).
String payload = input_row.JSON;

// 2) Bytes UTF-8 => signature calculée sur CES bytes
byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

// 3) Générer la valeur de signature
String sigValue = routines.HmacSig.buildSignatureValue(payloadBytes, context.webhookSecret, SIG_PREFIX);

// 4) Sécurité : si secret/signature absents, on force une valeur invalidante (ou tu peux throw)
boolean canSign = (context.webhookSecret != null && !context.webhookSecret.isEmpty()) && (sigValue != null);

// 5) Stocker pour tRESTClient
context.webhook_payload=payload;
context.webhook_sig=sigValue;
context.webhook_sig_header_name=SIG_HEADER_NAME;
context.webhook_can_sign=canSign;

// 6) Logs minimaux (pas de secret, pas de body complet)
System.out.println(
    "Webhook sign: canSign=" + canSign
    + " bodyLen=" + payloadBytes.length
    + " sigPrefix=" + (SIG_PREFIX == null ? "<none>" : SIG_PREFIX)
);
System.out.println("----------------------------------------- ");

System.out.println("context.webhook_payload= "+context.webhook_payload);
System.out.println("context.webhook_sig= "+context.webhook_sig);
System.out.println("context.webhook_sig_header_name= "+context.webhook_sig_header_name);
System.out.println("context.webhook_can_sign= "+context.webhook_can_sign);


~~~

> Attention : Ici, je loggue le payload et la signature. C’est volontaire, parce que c’est un lab.  
> En production, masque ou supprime ces éléments (payload, signature, secret).

### Variables de contexte à créer

Ce code s’appuie sur **5 variables de contexte**. Tu dois donc les créer (et les renseigner) :

- `webhookSecret` : le **secret partagé** utilisé pour générer la signature (identique côté `Receveur` et `Emetteur`)
- `webhook_payload` : le payload JSON (String) qui sera envoyé
- `webhook_sig` : la signature calculée (format `sha256=<hex>`)
- `webhook_sig_header_name` : le nom du header (ici `X-Signature-256`)
- `webhook_can_sign` : booléen indiquant si la signature a pu être générée

---

## Étape 3 — Appeler l’endpoint via `tRESTClient`

Dernière étape côté `Emetteur` : envoyer le webhook au job `Receveur`.

### Objectif
- envoyer le **payload JSON**
- ajouter le header : **`X-Signature-256: sha256=<hex>`**

### 1) Créer le sous-job d’envoi

Crée un sous-job composé de :
- un `tFixedFlowInput`
- un `tRESTClient`

Le `tFixedFlowInput` sert uniquement à passer le payload au `tRESTClient` (dans la colonne de type `String`).

![tFixedFlowInput - Envoi du body au tRestClient]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/2-tfixedflowinput-2.webp' | relative_url }}){:alt="tFixedFlowInput - Envoi du body au tRestClient" loading="lazy" decoding="async"}

### 2) Configuration “de base” du `tRESTClient`

- **URL** : `http://localhost:8088/services/webhook/talaxie` (lab : `Receveur` + `Emetteur` dans le même Studio)
- **Méthode** : `POST`
- **Content-Type** : `application/json`

![tRestClient - Configuration basique (Methode, Type de données)]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/2-trestclient.webp' | relative_url }}){:alt="tRestClient - Configuration basique (Methode, Type de données)" loading="lazy" decoding="async"}

### 3) Ajouter le header de signature (paramètres avancés)

- `webhook_sig_header_name` : `X-Signature-256`
- `webhook_sig` : `sha256=<hex>`

![tRestClient - Configuration avancée, ajout du Header]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/2-trestclient-2.webp' | relative_url }}){:alt="tRestClient - Configuration avancée, ajout du Header" loading="lazy" decoding="async"}

---

## Réalisation des tests

Objectif : valider deux comportements simples.

1) Si **secret + body** sont identiques côté `Emetteur` et `Receveur` → **200**  
2) Si tu changes **le secret** ou **le moindre byte du body** → **401**

### Comment lancer le lab

1) Lance d’abord le job **`Receveur`** (il doit être à l’écoute).  
2) Ensuite, exécute le job **`Emetteur`** (il envoie le POST signé).

---

### Test 1 — Secret correct

**Résultat attendu : `200`**

![test 1 - Secret correct : Emetteur]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-1-emetteur.webp' | relative_url }}){:alt="test 1 - Secret correct : Emetteur" loading="lazy" decoding="async"}

Côté `Receveur`, tu dois voir que la requête est acceptée et que le JSON est parsé.

![test 1 - Secret correct : Receveur]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-1-receveur.webp' | relative_url }}){:alt="test 1 - Secret correct : Receveur" loading="lazy" decoding="async"}

---

### Test 2 — Secret incorrect

**Résultat attendu : `401`**

Modifie uniquement le secret côté `Emetteur` (ex : ajoute `_test`), puis relance.

![test 2 - Secret incorrect : Emetteur]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-2-emetteur.webp' | relative_url }}){:alt="test 2 - Secret incorrect : Emetteur" loading="lazy" decoding="async"}

![test 2 - Secret incorrect : Emetteur - 401]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-2-emetteur-401.webp' | relative_url }}){:alt="test 2 - Secret incorrect : Emetteur - 401" loading="lazy" decoding="async"}

> Normal : si le secret diffère, la signature ne peut pas matcher → **401**.

Côté `Receveur`, tu dois voir le rejet :

![test 2 - Secret incorrect : Receveur - 401]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-2-receveur-401.webp' | relative_url }}){:alt="test 2 - Secret incorrect : Receveur - 401" loading="lazy" decoding="async"}

---

### Test 3 — JSON modifié (même “sens”, bytes différents)

**Résultat attendu : `401`**

1) Remets le secret correct.  
2) Exécute `Emetteur`, puis récupère :
   - le **body** envoyé
   - la valeur du header `X-Signature-256`

3) Rejoue la requête avec Postman (body + header inchangés) : **200**.

![test 3 - Postman - Header]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-3-emetteur-postman-header.webp' | relative_url }}){:alt="test 3 - Postman - Header" loading="lazy" decoding="async"}

![test 3 - Postman - Body]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-3-emetteur-postman.webp' | relative_url }}){:alt="test 3 - Postman - Body" loading="lazy" decoding="async"}

4) Modifie le JSON **sans recalculer la signature** (ex : change l’ordre de `nom` et `prenom`) → **401**.

![test 3 - Postman - Body modifié]({{ '/assets/img/blog/11-esb-api-webhook-partie-2/test-3-emetteur-postman-body-modifie.webp' | relative_url }}){:alt="test 3 - Postman - Body modifié" loading="lazy" decoding="async"}

> Normal : la signature protège les **bytes**. Si le body change, la signature devient invalide.

---

## Les pièges classiques

Voici les causes les plus fréquentes de **401** alors que “tout a l’air bon”.

### 1) Encodage implicite (UTF-8)
Tu signes des **bytes** : la moindre différence d’encodage → signature différente.

### 2) Tu signes un message… mais tu en envoies un autre
JSON reformaté, ordre des champs, sérialisation différente : au final, les bytes changent → rejet.

> Règle d’or : tu signes **exactement** ce qui est envoyé.

### 3) Logs dangereux
En prod, ne loggue jamais :
- le secret
- le payload complet (si sensible)
- la signature complète

Log minimal recommandé :
- `bodyLen`
- signature présente ou non
  
---

## Durcissement minimal (niveau au-dessus)

HMAC garantit l’intégrité + l’authenticité, mais **n’empêche pas le rejeu**.

OWASP recommande d’ajouter une protection replay (nonce, timestamp, etc.) :  
[https://scs.owasp.org/SCWE/SCSVS-COMM/SCWE-022/](https://scs.owasp.org/SCWE/SCSVS-COMM/SCWE-022/)

### Pattern simple

1) Ajouter :
- `X-Timestamp`
- `X-Delivery-Id` (unique)

2) Signer :
- `timestamp + "." + deliveryId + "." + body`

3) Côté serveur :
- refuser si timestamp trop ancien
- refuser si `deliveryId` déjà traité

---

## Talaxie n’est pas forcément le meilleur endroit pour ça

Ce lab montre une sécurisation simple (utile pour comprendre et tester).

En prod, une partie des contrôles gagne à être faite **avant** d’atteindre le job :
- rate limiting
- filtrage IP / allowlist
- WAF
- terminaison TLS, etc.

Typiquement via : NGINX / OpenResty, API Gateway, reverse proxy.

---

## Conclusion

Tu as maintenant un cycle complet fonctionnel :

- Partie 1 : réception + vérification HMAC
- Partie 2 : émission + signature HMAC

Tu sais :
- construire un payload JSON simple
- calculer une signature **HMAC-SHA256** correctement
- ajouter `X-Signature-256: sha256=<hex>`
- tester des cas **valides** / **invalides** de manière contrôlée

---

## Sources

- [RFC 2104 — HMAC](https://datatracker.ietf.org/doc/html/rfc2104)
- [GitHub — Webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads) *(référence “industrie”, même si ici on utilise `X-Signature-256`)*
- [GitHub — Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) *(principe HMAC + body brut)*
- [Oracle Java — `javax.crypto.Mac`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/javax/crypto/Mac.html)
- [Talend/Qlik — `tRESTClient`](https://help.qlik.com/talend/en-US/components/8.0/esb-rest/trestclient)
- [OWASP — REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP — Message Replay Vulnerabilities](https://scs.owasp.org/SCWE/SCSVS-COMM/SCWE-022/)