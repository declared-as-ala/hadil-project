# Fiche - Gestion de Paie

## 1. Objectif de la refonte

Le but principal etait de corriger la duplication de donnees entre `Paie`, `Poste` et `Affectation`.

Avant:

- la paie etait enregistree dans une collection `Paie`
- on y stockait des donnees deja presentes ailleurs:
  - `poste`
  - `salaire_base`
  - `prix_heure_sup`
  - `salaire_total`

Probleme:

- duplication en base
- risque d'incoherence entre le poste reel de l'employe et la paie stockee
- conception moins propre pour le diagramme de classe

Maintenant:

- la collection `Paie` n'est plus utilisee
- le salaire est calcule dynamiquement a partir de:
  - `Employe`
  - `Affectation`
  - `Poste`
  - `HeureSupplementaire`

## 2. Modifications realisees

### 2.1 Suppression de la persistance de la paie

Le modele `Paie` a ete retire.

Ancien fichier supprime:

- `Backend/src/models/Paie.model.js`

Effet:

- les fiches de paie ne sont plus stockees dans MongoDB
- elles sont calculees au moment de la demande

### 2.2 Refonte du service de paie

Fichier principal:

- `Backend/src/services/paie.service.js`

Ce service:

- valide le mois et l'annee
- cherche l'affectation active d'un employe
- recupere le poste lie a cette affectation
- lit `salaire_base` et `prix_heure_sup`
- recupere les heures supplementaires du mois
- calcule:
  - `total_heures_sup`
  - `montant_heures_sup`
  - `salaire_total`

Formule:

```text
salaire_total = salaire_base + (total_heures_sup * prix_heure_sup)
```

### 2.3 Nettoyage des routes et controllers paie

Fichiers:

- `Backend/src/controllers/paie.controller.js`
- `Backend/src/routes/paies.routes.js`

Modifications:

- suppression des endpoints de generation de paie
- suppression de la logique de suppression d'une paie stockee
- conservation des endpoints de consultation et calcul

Endpoints utiles maintenant:

- `GET /api/paies`
- `GET /api/paies/mes-paies`
- `GET /api/paies/calculer`
- `GET /api/paies/document`

### 2.4 Mise a jour du service employe

Fichier:

- `Backend/src/services/employe.service.js`

Modifications:

- suppression de la dependance a `Paie.model`
- ajout d'une synchronisation automatique entre le nom du poste de l'employe et une vraie `Affectation`
- enrichissement dynamique des employes avec leur salaire calcule

Consequence:

- quand on cree ou modifie un employe, le systeme essaie de le relier a un vrai `Poste` via `Affectation`

### 2.5 Mise a jour du service des demandes documentaires

Fichier:

- `Backend/src/services/demandeDocument.service.js`

Modification:

- la fiche de paie utilise maintenant le calcul dynamique
- elle ne depend plus d'une paie stockee en base

### 2.6 Nettoyage de la base

Fichiers:

- `Backend/cleanup-orphans.js`
- `Backend/package.json`

Modification:

- ajout d'un script de nettoyage de l'ancienne collection `paies`

Effet:

- l'ancienne collection `paies` a ete supprimee

### 2.7 Adaptation du frontend paie

Fichiers:

- `client/src/pages/paie/PaiePage.jsx`
- `client/src/api/paie.api.js`

Modifications:

- l'ecran paie affiche maintenant des fiches calculees
- suppression du bouton "Generer toutes les paies"
- ajout d'un filtre de recherche par employe
- conservation des onglets:
  - fiches de paie
  - postes
  - affectations

## 3. Structure metier actuelle

La paie repose sur 3 sources principales:

### Poste

Fichier:

- `Backend/src/models/Poste.model.js`

Contient:

- `nom_poste`
- `salaire_base`
- `prix_heure_sup`

### Affectation

Fichier:

- `Backend/src/models/Affectation.model.js`

Contient:

- l'employe
- le poste
- `date_debut`
- `date_fin`

Role:

- indique quel poste est actif pour un employe a une periode donnee

### HeureSupplementaire

Fichier:

- `Backend/src/models/HeureSupplementaire.model.js`

Contient:

- l'employe
- le nombre d'heures supplementaires
- la date

Role:

- fournit les heures a additionner au salaire de base

## 4. Fonctionnement complet de la gestion de paie

### Etape 1 - L'utilisateur ouvre la page paie

Fichier:

- `client/src/pages/paie/PaiePage.jsx`

Le composant principal choisit la vue selon le role:

- `admin` et `rh` voient `AdminPaieView`
- `employe` voit `EmployeePaieView`

### Etape 2 - Le frontend appelle l'API

Fichier:

- `client/src/api/paie.api.js`

Le frontend utilise:

- `paieAPI.getAll()` pour les RH/Admin
- `paieAPI.getMesPaies()` pour l'employe
- `paieAPI.getDocument()` pour les fiches exportables

### Etape 3 - Le backend identifie l'utilisateur

Fichier:

- `Backend/src/middlewares/auth.middleware.js`

Le middleware:

- lit le token JWT
- retrouve l'utilisateur
- cherche le profil employe lie
- ajoute `employeeId` dans `req.user`

### Etape 4 - Le controller paie recoit la demande

Fichier:

- `Backend/src/controllers/paie.controller.js`

Il recupere:

- `mois`
- `annee`
- eventuellement `employeId`

Puis il appelle `paieService`.

### Etape 5 - Le service paie prepare la periode

Fichier:

- `Backend/src/services/paie.service.js`

Le service:

- verifie le mois et l'annee
- construit `startDate` et `endDate`

But:

- limiter le calcul a la periode choisie

### Etape 6 - Le service cherche l'affectation active

Le service recherche l'affectation qui:

- appartient a l'employe
- commence avant la fin du mois
- n'est pas terminee avant le debut du mois

But:

- savoir quel poste utiliser pour calculer le salaire

### Etape 7 - Le service lit le poste

Depuis l'affectation, il recupere:

- `nom_poste`
- `salaire_base`
- `prix_heure_sup`

But:

- obtenir la partie fixe du salaire

### Etape 8 - Le service recupere les heures supplementaires

Le service interroge `HeureSupplementaire` pour:

- le meme employe
- entre `startDate` et `endDate`

But:

- calculer la somme des heures supplementaires du mois

### Etape 9 - Le service calcule la fiche

Le service calcule:

- `total_heures_sup`
- `montant_heures_sup`
- `salaire_total`

Puis il renvoie un objet de fiche calculee.

Important:

- cette fiche n'est pas sauvegardee en base
- elle est seulement renvoyee au frontend

### Etape 10 - Le frontend affiche le resultat

Dans `AdminPaieView`:

- l'admin choisit le mois et l'annee
- clique sur `Afficher`
- les fiches calculees apparaissent dans un tableau

Dans `EmployeePaieView`:

- l'employe consulte son historique calcule pour l'annee

## 5. Recherche par employe

Fichier:

- `client/src/pages/paie/PaiePage.jsx`

Ajout realise:

- champ de recherche par:
  - nom
  - prenom
  - email
  - poste

But:

- afficher rapidement le salaire d'un employe precis

## 6. Conditions pour qu'une paie soit calculable

Pour qu'une fiche de paie apparaisse correctement, il faut:

1. un employe existant
2. une affectation active pour la periode
3. un poste lie a cette affectation
4. un salaire de base dans ce poste
5. eventuellement des heures supplementaires sur la periode

Si une affectation ou un poste manque:

- la paie peut etre vide
- ou les montants peuvent tomber a `0`

## 7. Avantages de la nouvelle version

- plus de duplication des donnees
- meilleure coherence avec le diagramme de classe
- plus simple a maintenir
- plus logique metierement
- la fiche de paie reste disponible a l'affichage
- les recherches et documents utilisent le meme calcul central

## 8. Resume final

La gestion de paie a ete transformee d'un systeme de stockage de fiches vers un systeme de calcul dynamique.

Avant:

- on stockait des paies en base

Maintenant:

- on stocke seulement les donnees sources
- on calcule la paie a la demande

Sources du calcul:

- `Poste`
- `Affectation`
- `HeureSupplementaire`

Affichage:

- page paie admin
- page paie employe
- document de fiche de paie

Cette architecture est plus propre techniquement et plus correcte du point de vue conception.
