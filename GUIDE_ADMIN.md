# 📖 GUIDE D'UTILISATION ADMINISTRATEUR

## Table des matières
1. [Connexion](#connexion)
2. [Tableau de bord](#tableau-de-bord)
3. [Gestion des conventions](#gestion-des-conventions)
4. [Gestion des codes de réduction](#gestion-des-codes-de-réduction)
5. [Gestion des marges](#gestion-des-marges)
6. [Cas d'usage courants](#cas-dusage-courants)

---

## 1. Connexion

### Accéder à l'administration
1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:3000/admin/login`
3. Entrez vos identifiants :
   - **Username** : admin
   - **Password** : admin123

⚠️ **Important** : Changez le mot de passe par défaut en production !

### Première connexion
Après la première connexion, vous serez redirigé vers le tableau de bord.

---

## 2. Tableau de bord

Le tableau de bord affiche :
- 📋 Nombre de conventions actives
- 🎫 Nombre total de codes créés
- ✅ Nombre de codes actifs

### Actions rapides disponibles :
- **Gérer les conventions** : Créer et modifier les conventions
- **Gérer les codes** : Créer et gérer les codes de réduction
- **Gérer les marges** : Configurer les marges de prix
- **Voir le site public** : Accéder à la page client

---

## 3. Gestion des conventions

### Créer une nouvelle convention

1. Cliquez sur "Gérer les conventions" ou allez dans le menu "Conventions"
2. Cliquez sur le bouton "+ Nouvelle convention"
3. Remplissez le formulaire :
   - **Nom de la convention** * (obligatoire)
     - Exemple : "Ministère de la Santé"
   - **Pourcentage de réduction (%)** * (obligatoire)
     - Exemple : 20 pour 20% de réduction
   - **Valide du** (optionnel)
     - Date de début de validité
   - **Valide jusqu'au** (optionnel)
     - Date de fin de validité
4. Cliquez sur "Ajouter"

### Modifier une convention

1. Dans la liste des conventions, cliquez sur "Modifier"
2. Modifiez les champs souhaités :
   - Nom
   - Pourcentage de réduction
   - Statut (actif/inactif)
   - Dates de validité
3. Cliquez sur "Enregistrer"

### Désactiver une convention

1. Cliquez sur "Modifier" sur la convention
2. Décochez "Convention active"
3. Cliquez sur "Enregistrer"

⚠️ **Note** : Les codes associés à une convention inactive ne fonctionneront plus.

### Supprimer une convention

1. Cliquez sur "Supprimer" à côté de la convention
2. Confirmez la suppression

⚠️ **Attention** : Cette action est irréversible et supprimera également tous les codes associés.

---

## 4. Gestion des codes de réduction

### Créer un nouveau code

1. Allez dans "Codes" depuis le menu
2. Cliquez sur "+ Nouveau code"
3. Remplissez le formulaire :
   - **Code de réduction** * (obligatoire)
     - Entrez un code ou cliquez sur "Générer un code"
     - Le code sera automatiquement en majuscules
   - **Convention** * (obligatoire)
     - Sélectionnez la convention associée
   - **Valide du** (optionnel)
   - **Valide jusqu'au** (optionnel)
4. Cliquez sur "Ajouter"

### Générer un code automatiquement

Dans le formulaire de création, cliquez sur le bouton "Générer un code". Un code aléatoire de 10 caractères sera créé automatiquement.

### Modifier un code

1. Cliquez sur "Modifier" à côté du code
2. Modifiez les champs :
   - Code
   - Convention associée
   - Statut (actif/inactif)
   - Dates de validité
3. Cliquez sur "Enregistrer"

### Désactiver temporairement un code

1. Cliquez sur "Modifier"
2. Décochez "Code actif"
3. Cliquez sur "Enregistrer"

Le code ne sera plus valide jusqu'à ce que vous le réactiviez.

### Supprimer un code

1. Cliquez sur "Supprimer" à côté du code
2. Confirmez la suppression

---

## 5. Gestion des marges

Les marges sont des ajouts appliqués aux prix de base AVANT le calcul de la réduction.

### Types de marges

1. **Marge globale** : S'applique à tous les hôtels
2. **Marge par hôtel** : S'applique à un hôtel spécifique
3. **Marge par type de chambre** : S'applique à un type de chambre

### Créer une marge globale

1. Allez dans "Marges"
2. Sélectionnez "Marge globale" dans le type
3. Entrez la valeur de la marge
4. Choisissez l'unité :
   - **Pourcentage (%)** : Exemple : 10 pour +10%
   - **Montant fixe (€)** : Exemple : 15 pour +15€
5. Cliquez sur "Enregistrer la marge"

### Créer une marge spécifique

1. Sélectionnez le type :
   - "Marge par hôtel" ou "Marge par type de chambre"
2. Entrez l'ID de l'entité :
   - Pour un hôtel : l'ID de l'hôtel (ex: 1)
   - Pour un type de chambre : le type (ex: "Suite")
3. Entrez la valeur et l'unité
4. Cliquez sur "Enregistrer la marge"

### Modifier une marge existante

Pour modifier une marge, créez-en une nouvelle avec le même type et ID. Elle remplacera l'ancienne.

### Supprimer une marge

1. Cliquez sur "Supprimer" à côté de la marge
2. Confirmez la suppression

---

## 6. Cas d'usage courants

### Cas 1 : Nouveau partenaire

**Objectif** : Ajouter une nouvelle entreprise partenaire avec 15% de réduction

**Étapes** :
1. Créer une convention :
   - Nom : "Entreprise XYZ"
   - Réduction : 15%
2. Créer un code :
   - Code : ENTREPRISEXYZ
   - Convention : "Entreprise XYZ"
3. Communiquer le code au partenaire

### Cas 2 : Promotion temporaire

**Objectif** : Offre spéciale pour le mois de décembre

**Étapes** :
1. Créer une convention :
   - Nom : "Promotion Décembre"
   - Réduction : 30%
   - Valide du : 01/12/2024
   - Valide jusqu'au : 31/12/2024
2. Créer un code :
   - Code : NOEL2024
   - Convention : "Promotion Décembre"
   - Dates : 01/12/2024 au 31/12/2024

### Cas 3 : Augmenter les marges

**Objectif** : Augmenter tous les prix de 10% avant réductions

**Étapes** :
1. Aller dans "Marges"
2. Type : "Marge globale"
3. Valeur : 10
4. Unité : "Pourcentage (%)"
5. Enregistrer

**Résultat** : 
- Prix de base : 100€
- Avec marge : 110€
- Avec réduction 20% : 88€

### Cas 4 : Désactiver temporairement un partenaire

**Objectif** : Suspendre l'accès d'un partenaire sans supprimer ses données

**Étapes** :
1. Aller dans "Codes"
2. Trouver le code du partenaire
3. Cliquer sur "Modifier"
4. Décocher "Code actif"
5. Enregistrer

### Cas 5 : Marge spéciale pour un hôtel de luxe

**Objectif** : Appliquer 20€ de marge fixe sur l'hôtel ID 5

**Étapes** :
1. Aller dans "Marges"
2. Type : "Marge par hôtel"
3. ID Entité : 5
4. Valeur : 20
5. Unité : "Montant fixe (€)"
6. Enregistrer

---

## 📊 Exemple de workflow complet

### Scénario : Nouveau partenaire "Hôpital Central"

1. **Créer la convention**
   - Nom : "Hôpital Central"
   - Réduction : 25%
   - Pas de dates (validité illimitée)

2. **Générer 3 codes** (un par service)
   - Code 1 : HOPITAL-URGENCES
   - Code 2 : HOPITAL-PEDIATRIE
   - Code 3 : HOPITAL-ADMIN
   - Tous associés à la convention "Hôpital Central"

3. **Envoyer les codes** aux responsables de chaque service

4. **Suivre l'utilisation** via le tableau de bord

---

## 🔐 Sécurité

### Bonnes pratiques

✅ **À FAIRE** :
- Changer le mot de passe par défaut
- Générer des codes complexes
- Définir des dates de validité
- Désactiver les codes inutilisés
- Vérifier régulièrement les conventions actives

❌ **À NE PAS FAIRE** :
- Partager vos identifiants admin
- Utiliser des codes faciles à deviner
- Laisser des conventions inactives avec des codes actifs
- Supprimer sans vérification

---

## ❓ FAQ

**Q : Puis-je avoir plusieurs codes pour une même convention ?**  
R : Oui ! Vous pouvez créer autant de codes que vous voulez pour une convention.

**Q : Que se passe-t-il si je désactive une convention ?**  
R : Tous les codes associés à cette convention ne fonctionneront plus.

**Q : Comment calculer le prix final ?**  
R : Prix final = (Prix de base + Marge) - Réduction

**Q : Les marges s'additionnent-elles ?**  
R : Non, seule la marge la plus spécifique s'applique (par chambre > par hôtel > globale).

**Q : Puis-je récupérer un code supprimé ?**  
R : Non, les suppressions sont définitives. Vous devrez créer un nouveau code.

---

## 📞 Support

En cas de problème :
1. Vérifiez cette documentation
2. Consultez le README.md technique
3. Contactez le support technique

---

**Version** : 1.0  
**Dernière mise à jour** : 2024
