# 🔄 Le Flux de Fonctionnement : De l'Interface à la Base de Données

Voici comment l'information voyage étape par étape entre ce que vous voyez à l'écran (Frontend) et le cerveau de l'application (Backend / Base de données).

---

## 🏷️ 1. La page de Poste : Comment on ajoute un poste

L'objectif est d'enregistrer un modèle de salaire réutilisable (ex: Développeur Senior = 2500 DT).

**1. Frontend (L'Action Utilisateur)**
* **Fichier :** `client/src/pages/paie/PaiePage.jsx`
* Vous remplissez le formulaire "Créer un poste" (Nom, Salaire de base, Prix heure sup).
* Quand vous cliquez sur "Enregistrer", la fonction `handleCreatePoste` est déclenchée.
* Elle prend vos données et fait un appel réseau (HTTP POST) vers `postesAPI.create()`.

**2. Le Réseau (L'API)**
* La requête arrive sur l'URL `http://votre-serveur/api/postes`.

**3. Backend (La Réception & Le Traitement)**
* **Fichier :** `Backend/src/routes/postes.routes.js`
  * Le serveur voit que c'est une requête "POST". Il vérifie que vous avez bien le rôle Admin/RH (grâce au middleware `authorize`).
* **Fichier :** `Backend/src/controllers/poste.controller.js`
  * Le contrôleur attrape la balle, valide rapidement les données, et l'envoie au service.
* **Fichier :** `Backend/src/services/poste.service.js`
  * Le service crée une nouvelle "boîte" dans la base de données en utilisant `Poste.model.js`.
  * Le document est sauvegardé dans MongoDB.

**4. Le Retour au Frontend**
* Le serveur répond "Code 201 : Créé avec succès".
* Le `PaiePage.jsx` affiche la petite notification verte (`toast.success`), ferme le formulaire, et lance immédiatement `loadPostes()` pour récupérer la nouvelle liste et l'afficher dans votre tableau.

---

## 🔗 2. L'Affectation : Ajout Manuel et Synchronisation

L'affectation est le lien direct (le contrat de salaire) entre un `Employé` physique et un `Poste` abstrait.

**Scénario A : Ajout Manuel**
* Le flux est identique à la création d'un poste. Vous choisissez un Employé et un Poste dans la liste déroulante (`handleCreateAffectation`).
* Le Backend crée une ligne dans `Affectation.model.js` contenant `[ID_Employé, ID_Poste, Date_Debut]`.

**Scénario B : La Synchronisation Automatique (Le Bouton Bleu "Sync")**
C'est un script intelligent pour vous éviter de tout taper à la main si vous aviez déjà des employés.
* **Frontend** : Vous cliquez sur le bouton "Sync", ce qui lance `handleSync`.
* **Backend (Service)** : La fonction `syncFromEmployes()` s'active. Voici sa logique :
  1. Elle récupère **tous** les employés existants dans la base de données.
  2. Elle regarde le champ texte "poste" de chaque employé (ex: "Secrétaire").
  3. Elle vérifie si une `Affectation` existe déjà pour cet employé. Si oui, elle l'ignore.
  4. Si non, elle regarde si le poste "Secrétaire" existe déjà dans le tableau des Postes. Si le poste n'existe pas, **elle le crée automatiquement** avec un salaire de 0 DT (pour que vous puissiez le modifier plus tard).
  5. Enfin, elle crée l'`Affectation` reliant l'employé à ce poste avec la date du jour.

---

## 💰 3. Le Calcul du Salaire et sa Gestion

C'est le processus le plus complexe, car c'est lui qui brasse l'argent de l'entreprise.

**1. Le Déclencheur (Frontend)**
* Vous sélectionnez le Mois et l'Année, puis cliquez sur "Générer toutes les paies" (`handleGenererToutes`).

**2. Le Cerveau (Backend - `paie.service.js`)**
La fonction `genererToutesPaies` s'active :
1. Elle récupère la liste de **tous les employés "actifs"**.
2. **Pour chaque employé**, elle lance la calculatrice (`calculerSalaire`) :
   * **Recherche du contrat** : Le code va chercher dans la base s'il y a une `Affectation` active pour cet employé *précisément pour le mois demandé*.
   * **Attribution de la Base** : 
     - S'il y a une affectation, le système prend le `salaire_base` et le `prix_heure_sup` du `Poste` affecté.
     - S'il n'y a *aucune* affectation, il prend en secours les montants inscrits directement sur le profil de l'Employé.
   * **Ajout des Bonus** : Le système interroge la table `HeureSupplementaire.model.js` pour voir s'il y a des heures validées ce mois-ci. Il les multiplie par le prix de l'heure sup.
   * **Le Résultat** : `Salaire Total = Salaire de base + Montant Heures Sup`.
3. Le système crée (ou met à jour si elle existait déjà) la fiche de `Paie` dans la base de données.

**3. L'Affichage Admin**
* Le frontend recharge la liste et affiche tout le monde avec de belles étiquettes vertes "1500.00 DT".

---

## 👨‍💻 4. L'Affichage du côté de l'Employé

Nous voulons que l'employé puisse voir ses propres fiches, mais il est strictement interdit qu'il voie celles de ses collègues.

**1. Le Filtre Visuel (Frontend)**
* Toujours dans le fichier `PaiePage.jsx` : le Routeur React voit que le rôle n'est pas Admin. Il bloque l'accès à `AdminPaieView` et charge le composant `<EmployeePaieView />`.
* L'employé ne voit pas les onglets (Postes, Affectations), ni le bouton "Générer". Il voit juste un tableau en lecture seule.

**2. Le Filtre de Sécurité (Backend)**
* Le composant frontend demande au serveur : "Donne-moi mes fiches" via `paieAPI.getMyPaies()`.
* La requête part vers `GET /api/paies/mes-paies`.
* **Sécurité absolue** : Le contrôleur backend `paie.controller.js` ne demande pas à l'employé quel est son ID (l'employé pourrait tricher et envoyer l'ID du patron). Le backend regarde la "carte d'identité cryptée" (le token JWT généré à la connexion).
* Il extrait l'ID de l'employé depuis ce token intraçable, et dit à la base de données : *"Donne-moi uniquement les fiches de paie où le champ Employé correspond à cet ID"*.
* La donnée redescend vers l'interface de l'employé de façon 100% sécurisée.
