---
layout: post
title: "Chiffre vraiment tes mots de passe Talend & Talaxie : passer à AES"
description: "Passer du masquage Base64 à un chiffrement réel (AES/GCM) pour sécuriser sérieusement tes mots de passe dans Talend/Talaxie."
categories: blog
tags: [Talend, Talaxie, Sécurité, Chiffrement, AES, ETL, Bonnes pratiques]
image: "/assets/img/blog/6-chiffrement_AES/logo_1024.webp"
active: true
parent_category: talend-securite
category_label: Sécurité
---

Dans le premier article, on a fait le ménage : on a enfin arrêté de stocker des mots de passe en clair dans un projet Talend/Talaxie grâce à un masquage “hygiène” en Base64.

>Si tu l’as raté, commence ici avant d'aller plus loin :       
>➡️ [Article 1/2 - Base64](https://bmdata.fr/blog/chiffrer-des-mots-de-passe-base64/)

Mais soyons clairs : Base64, c’est uniquement une manière de *retirer visuellement le mot de passe du projet*.  
C’est pédagogique, utile, minimal… mais ça ne protège **rien** si quelqu’un met la main sur la chaîne encodée.

Ici, on passe au niveau supérieur : **un vrai chiffrement** avec **AES/GCM**, robuste, moderne, et parfaitement utilisable dans Talend/Talaxie.

> Pour t’aider, j’ai mis un dépôt GitHub contenant les routines Base64 + AES ainsi qu'un job d'exemple:  
> ➡️ [Github d'exemple Base64+AES](https://github.com/mbodetdata/BMDATA_Blog-securisation_des_mots_de_passes.git)

<!--more-->

---

## 1. Pourquoi passer d’un masquage Base64 à un chiffrement AES ?

Base64 :
- masque un mot de passe mais ne le protège pas,
- est réversible avec n’importe quel outil web,
- ne repose sur aucun secret,
- ne tient pas 2 secondes face à un attaquant motivé.
- c'est de l'encodage, pas du chiffrement ! 

AES/GCM :
- est un *vrai* chiffrement symétrique,
- rend la donnée inutilisable sans la clé,
- résiste même si ton projet Talend/Talaxie fuite,
- sécurise enfin les environnements sensibles (prod, comptes techniques puissants, API externes…).

Base64 = hygiène  
AES = sécurité

---

## 2. Ce qui change — et ce qui reste identique

**On garde :**
- une routine Java `Chiffrements`,
- des mots de passe stockés chiffrés,
- la clé fournie au runtime (fichier externe, variable d’environnement, scheduler…),
- le déchiffrement “à la volée” dans les composants Talend/Talaxie.

**On change :**
- l’algorithme → AES/GCM,
- la robustesse → chiffrement réel,
- la discipline → si la clé fuite, tous les secrets sont compromis.

---

## 3. Routine Java AES — version prête à l’emploi

Voici la routine java, prête pour être copiée directement dans ta classe `Chiffrements.java`.     
> Remplace la totalitée, j'ai repris les methodes de chiffrement/dechiffrement de Base64.
  
---  

```java
package routines;
 
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class Chiffrements {

    /*
     * Constantes pour le chiffrement AES en mode GCM
     */
    private static final String AES_ALGO = "AES";
    private static final String AES_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int AES_KEY_SIZE_BYTES = 16;        // 128 bits
    private static final int GCM_TAG_LENGTH_BITS = 128;      // taille du tag d'authentification
    private static final int GCM_IV_LENGTH_BYTES = 12;       // IV de 96 bits recommandé pour GCM

    /*
     * Dérive une clé AES 128 bits à partir de la clé fournie par l'utilisateur.
     * Principe :
     *  - on calcule un SHA-256 de la clé fournie
     *  - on prend les 16 premiers octets pour obtenir une clé de 128 bits
     */
    private static SecretKeySpec deriveKey(String key) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = sha.digest(key.getBytes(StandardCharsets.UTF_8));

        byte[] aesKey = new byte[AES_KEY_SIZE_BYTES];
        System.arraycopy(keyBytes, 0, aesKey, 0, AES_KEY_SIZE_BYTES);

        return new SecretKeySpec(aesKey, AES_ALGO);
    }

    /*
     * Chiffrement "léger" basé sur Base64.
     * Objectif : ne plus stocker le mot de passe en clair dans les fichiers Talend,
     * pas de fournir un chiffrement fort.
     */
    public static String chiffrementBase64(String str, String key) {

        if (key == null || key.length() < 2) {
            System.err.println("Longueur de clé trop petite (2 caracteres minimum)");
            return null;
        }

        if (Relational.ISNULL(str) || str.equals("")) {
            System.err.println("La chaine a encrypter est vide, impossible de chiffrer");
            return null;
        }

        // Encodage de la clé en Base64 pour l'injecter dans la chaîne
        String encodedKey = Base64.getEncoder().withoutPadding().encodeToString(key.getBytes(StandardCharsets.UTF_8));

        // Construction de la chaîne "longueur + clé encodée + mot de passe"
        String toEncode = str.length() + encodedKey + str;

        // Encodage global en Base64 pour obtenir la valeur à stocker
        String encodedString = Base64.getEncoder().withoutPadding().encodeToString(toEncode.getBytes(StandardCharsets.UTF_8));

        return encodedString;
    }

    /*
     * Déchiffrement / décodage de la version Base64.
     * On récupère la chaîne d'origine si la structure attendue est respectée.
     */
    public static String dechiffrementBase64(String encstr, String key) {

        if (Relational.ISNULL(encstr) || encstr.equals("")) {
            System.err.println("La chaine a dechiffrer est vide, impossible de poursuivre le traitement");
            return null;
        }

        if (key == null || key.length() < 2) {
            System.err.println("Longueur de clé trop petite (2 caracteres minimum)");
            return null;
        }

        String encodedKey = Base64.getEncoder().withoutPadding().encodeToString(key.getBytes(StandardCharsets.UTF_8));

        // Décodage Base64 de la chaîne complète
        byte[] decodedBytes = Base64.getDecoder().decode(encstr);
        String decoded = new String(decodedBytes, StandardCharsets.UTF_8);

        // Extraction de la partie après la clé encodée
        int keyIndex = decoded.indexOf(encodedKey);
        if (keyIndex < 0) {
            System.err.println("Clé introuvable dans la chaine fournie, impossible de dechiffrer");
            return null;
        }

        String lengthPart = decoded.substring(0, keyIndex);
        String str = decoded.substring(keyIndex).replace(encodedKey, "");

        // Vérification de cohérence sur la longueur
        try {
            int expectedLength = Integer.parseInt(lengthPart);
            if (decoded.contains(encodedKey) && (str.length() == expectedLength)) {
                return str;
            } else {
                System.err.println("Incoherence detectee lors du dechiffrement Base64");
                return null;
            }
        } catch (NumberFormatException e) {
            System.err.println("Longueur invalide lors du dechiffrement Base64 : " + e.getMessage());
            return null;
        }
    }

    /*
     * Chiffrement AES en mode GCM.
     * Utiliser cette méthode pour des mots de passe sensibles.
     * La valeur retournée est encodée en Base64 pour être stockable dans les contextes.
     */
    public static String chiffrementAES(String str, String key) {

        try {
            if (key == null || key.length() < 8) {
                System.err.println("Longueur de clé trop petite (8 caracteres minimum recommande)");
                return null;
            }

            if (Relational.ISNULL(str) || str.equals("")) {
                System.err.println("La chaine a chiffrer est vide, impossible de chiffrer");
                return null;
            }

            // Dérivation de la clé AES à partir de la clé fournie
            SecretKeySpec secretKey = deriveKey(key);

            // Génération d'un IV aléatoire pour AES/GCM
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // Initialisation du cipher en mode chiffrement
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            // Chiffrement de la donnée
            byte[] cipherText = cipher.doFinal(str.getBytes(StandardCharsets.UTF_8));

            // Concaténation IV + texte chiffré
            byte[] combined = new byte[GCM_IV_LENGTH_BYTES + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, GCM_IV_LENGTH_BYTES);
            System.arraycopy(cipherText, 0, combined, GCM_IV_LENGTH_BYTES, cipherText.length);

            // Encodage Base64 pour stockage dans les contextes / fichiers
            return Base64.getEncoder().encodeToString(combined);

        } catch (Exception e) {
            System.err.println("Erreur lors du chiffrement AES : " + e.getMessage());
            return null;
        }
    }

    /*
     * Déchiffrement AES en mode GCM.
     * Prend une chaîne Base64 produite par chiffrementAES et retourne le texte en clair.
     */
    public static String dechiffrementAES(String encstr, String key) {

        try {
            if (Relational.ISNULL(encstr) || encstr.equals("")) {
                System.err.println("La chaine a dechiffrer est vide, impossible de poursuivre le traitement");
                return null;
            }

            if (key == null || key.length() < 8) {
                System.err.println("Longueur de clé trop petite (8 caracteres minimum recommande)");
                return null;
            }

            // Dérivation de la clé AES
            SecretKeySpec secretKey = deriveKey(key);

            // Décodage de la chaîne Base64
            byte[] combined = Base64.getDecoder().decode(encstr);

            if (combined.length <= GCM_IV_LENGTH_BYTES) {
                System.err.println("Donnees chiffrées invalides (taille insuffisante)");
                return null;
            }

            // Séparation IV et texte chiffré
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byte[] cipherText = new byte[combined.length - GCM_IV_LENGTH_BYTES];

            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH_BYTES);
            System.arraycopy(combined, GCM_IV_LENGTH_BYTES, cipherText, 0, cipherText.length);

            // Initialisation du cipher en mode déchiffrement
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            // Déchiffrement
            byte[] plainText = cipher.doFinal(cipherText);

            return new String(plainText, StandardCharsets.UTF_8);

        } catch (Exception e) {
            System.err.println("Erreur lors du dechiffrement AES : " + e.getMessage());
            return null;
        }
    }

    /*
     * Méthodes historiques conservées pour compatibilité.
     * Elles appellent la version Base64.
     * Tu peux les supprimer si tu veux forcer l'usage explicite de chiffrementBase64 / chiffrementAES.
     */

    public static String chiffrement(String str, String key) {
        return chiffrementBase64(str, key);
    }

    public static String dechiffrement(String encstr, String key) {
        return dechiffrementBase64(encstr, key);
    }
}
```

> **Comment marche ce chiffrement !**      
> *Chiffrement AES/GCM*      
> 1. Dériver une clé AES 128 bits à partir de la clé fournie.      
> 2. Générer un IV (aléatoire, 12 octets).      
> 3. Initialiser AES-GCM en mode chiffrement avec la clé dérivée + IV.      
> 4. Chiffrer le texte → obtenir données chiffrées + tag d’authentification GCM.      
> 5. Concaténer IV + données chiffrées.      
> 6. Encoder l’ensemble en Base64 pour stockage.      
>      
> *Déchiffrement AES/GCM*      
> 1. Dériver la même clé AES 128 bits.      
> 2. Décoder le Base64 pour récupérer les octets.      
> 3. Séparer IV et données chiffrées.      
> 4. Initialiser AES-GCM en mode déchiffrement avec la clé dérivée + IV.      
> 5. Déchiffrer et vérifier le tag d’authentification.      
> 6. Retourner le texte en clair.      

---
## 4. Comment utiliser AES dans un job Talend/Talaxie ?

La mécanique reste la même que celle présentée dans l’article Base64 :
- tu chiffres une fois,  
- tu stockes uniquement la version chiffrée,  
- tu déchiffres à la volée au runtime.  

La différence : cette fois, le secret devient **inexploitable** sans la clé AES.

### Étape 1 — Mettre à jour la routine Java

- Remplace toute la routine par celle fournie dans cet article.  
- Talend/Talaxie recompile, et ton chiffrement AES est immédiatement disponible.

![Création routine AES]({{ '/assets/img/blog/6-chiffrement_AES/1-creation_routine_aes.webp' | relative_url }}){:alt="Ajout AES dans la routine Talend/Talaxie" loading="lazy" decoding="async"}

### Étape 2 — Définir la clé AES (la même que dans l’article Base64)

Nous allons reprendre exactement la même clé que dans le premier article, pour assurer la continuité :
```
F7Cjb9aQo!U$yBnoXcRPGxknctUb!7@qWzCo$?cc
```

> Cette clé est un exemple : ne l’utilise jamais en production, ne la versionne pas dans Git, stocke-la uniquement dans un fichier externe, une variable d’environnement, ou ton scheduler.

### Étape 3 — Chiffrer un mot de passe avec AES

On reprend aussi le même mot de passe :
```
Ceci est un mot de passe !
```

Appel de la routine :
```java
Chiffrements.chiffrementAES(
    "Ceci est un mot de passe !",
    "F7Cjb9aQo!U$yBnoXcRPGxknctUb!7@qWzCo$?cc"
)
```

![Utilisation dans un tJava]({{ '/assets/img/blog/6-chiffrement_AES/2-utilisation_tjava.webp' | relative_url }}){:alt="Utilisation dans un tJava" loading="lazy" decoding="async"}

Chaîne AES obtenue, encodés en Base64 pour permettre sont utilisation  :
```
WKiL9JWaa3DwWBs621wbADFILkKvAnIrVFMxq2s9Q6fJAHN2rjJMLeklt/9XGpfCm0ukULYE
```

![Utilisation dans un tJava]({{ '/assets/img/blog/6-chiffrement_AES/3-utilisation_tjava.webp' | relative_url }}){:alt="Utilisation dans un tJava et affichage de la chaîne" loading="lazy" decoding="async"}

> 💡 Cette fois, si tu colles cette valeur dans [base64decode.org](https://www.base64decode.org/), tu obtiens des octets illisibles (`\u0000\u0011"3DUf...`) :  impossible de retrouver le mot de passe sans la clé AES, contrairement au simple encodage Base64 du premier article.     
> On vient donc de *corriger* notre problématique de l'article 1, ou la chaîne etait clairement exploitable ! 

![Robustesse à base64decode.org]({{ '/assets/img/blog/6-chiffrement_AES/4-robustesse_a_base64decode.org.webp' | relative_url }}){:alt="Robustesse au decodage par base64decode.org" loading="lazy" decoding="async"}


### Étape 4 — Déchiffrer dans tes composants Talend/Talaxie

Dans un champ mot de passe d’un `tDBConnection`, par exemple :
```java
Chiffrements.dechiffrementAES(context.DB_PASSWORD_AES, context.SECRET_KEY_AES)
```

Où :
- `context.DB_PASSWORD_AES` contient la version AES chiffrée du mot de passe  
- `context.SECRET_KEY_AES` est fourni au runtime (fichier externe, scheduler, variable d’environnement)

Ton mot de passe n’apparaît nulle part en clair, ni dans les `.item`, ni dans les logs.

### Étape 5 — Vérifier que tout fonctionne correctement

Après intégration :
- ✔ La connexion fonctionne avec la bonne clé AES  
- ✔ Le job échoue proprement sans clé ou avec une clé incorrecte  
- ✔ Aucun mot de passe en clair dans les logs  
- ✔ Aucun mot de passe en clair dans les `.item`  
- ✔ Les chaînes AES sont incompréhensibles et non décodables

## 5. Organiser proprement la gestion des secrets AES

Voici les bonnes pratiques à respecter pour un chiffrement robuste :
- Stocker uniquement des versions chiffrées dans les contextes, ou mieux dans des fichiers externes.  
- Ne jamais versionner la clé AES  
- Rechiffre tous les secrets si la clé fuit  
- Centralise les secrets dans une zone dédiée, un gestionaire de mot de passe par exemple. 
- Injecte la clé AES au runtime uniquement  
- Documente : où est stockée la clé, qui y a accès, comment régénérer les secrets

## 6. Pièges à éviter

- Mettre la clé AES dans les contextes versionnés → erreur critique  
- Laisser temporairement un mot de passe en clair dans un composant  
- Utiliser AES d’un côté et Base64 de l’autre sans distinguer nettement les contextes  
- Tester uniquement en local  
- Supposer que “puisque c’est chiffré, je peux tout committer dans Git” → toujours non

## Conclusion

Avec AES, tu passes de :  
- Base64 = hygiène / masquage  
- AES = chiffrement réel / sécurité robuste  

> **Sans changer ton architecture Talend/Talaxie**     
> toujours une routine, toujours des contextes, toujours une clé externe.  

## ✅ Checklist AES

- [ ] Routine `Chiffrements` mise à jour  
- [ ] Clé AES fournie au runtime uniquement  
- [ ] Mot de passe chiffré avec AES  
- [ ] Contextes contenant uniquement des valeurs chiffrées  
- [ ] Composants utilisant `dechiffrementAES()`  
- [ ] Tests OK / tests KO sans clé AES  
- [ ] Logs et `.item` sans fuite  
- [ ] Procédure de rotation de clé documentée