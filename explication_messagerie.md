# 📩 Guide Complet : Le Fonctionnement de la Messagerie Interne

Le système de messagerie permet aux employés de communiquer de manière sécurisée et privée à l'intérieur de l'application. Voici le cheminement complet de l'information (le "flow") de A à Z.

---

## 🏗️ 1. L'Architecture : À quoi ressemble un Message ?
*📍 Fichier : `Backend/src/models/Message.model.js`*

Dans la base de données, un Message est défini par ces 5 informations fondamentales :
1. **L'Expéditeur** : L'ID de l'employé qui envoie.
2. **Le Destinataire** : L'ID de l'employé qui reçoit.
3. **Le Contenu (`message`)** : Le texte du message.
4. **La Date** : Enregistrée automatiquement à la milliseconde près.
5. **Le Statut (`lu`)** : Vaut `false` par défaut (Non lu).

---

## 📤 2. L'Envoi d'un message (Le Flow étape par étape)

**1. L'Action Frontend (`MessagesPage.jsx`)**
- L'utilisateur clique sur le bouton **"✉️ New Message"**.
- Une fenêtre contextuelle (Modal) s'ouvre avec un formulaire.
- Il choisit le nom du collègue dans la liste déroulante (le frontend a déjà chargé tous les employés via l'API `employesAPI.getAll()`).
- Il tape son texte et clique sur "Envoyer".
- La fonction `handleSend()` s'active.

**2. Le Voyage API**
- La fonction rassemble le texte et l'ID du collègue, puis fait un appel HTTP `POST` via `messagesAPI.send(form)`.

**3. Le Traitement Backend (`message.service.js`)**
- La fonction `createMessage` récupère la balle.
- **Sécurité** : Elle vérifie que les champs "Expéditeur" (pris depuis le token de connexion) et "Destinataire" ne sont pas vides.
- Elle crée la "boîte" du message dans la base de données MongoDB et la sauvegarde.
- Elle renvoie un message de succès (Code HTTP 201).
- Le Frontend affiche l'alerte verte "Message Envoyé !" et efface le formulaire.

---

## 📥 3. La Réception et l'Affichage (Inbox & Sent)

Comment le système sait-il quels messages afficher à qui ?

**1. Le Chargement Intelligent (`loadData()`)**
- Dès qu'un employé arrive sur la page Messagerie, React lance la fonction `loadData()`.
- Le système regarde sur quel **onglet** on se trouve :
  - Si on est sur l'onglet **Inbox (Boîte de réception)** : Le Frontend demande à l'API *"Donne-moi tous les messages où je suis le Destinataire"*.
  - Si on est sur **Sent (Messages envoyés)** : Le Frontend demande *"Donne-moi tous les messages où je suis l'Expéditeur"*.

**2. Le Tri côté Backend (`message.service.js`)**
- Le service exécute la recherche (`Message.find`).
- Il demande aussi à la base de données d'aller chercher les vrais noms et prénoms des expéditeurs/destinataires (grâce à la fonction `.populate()`).
- **L'ordre chronologique** : Il ajoute la commande `.sort({ date: -1 })` pour s'assurer que les messages les plus récents apparaissent toujours tout en haut.

**3. L'Interface Utilisateur (UI)**
- Le Frontend reçoit le tableau de messages.
- Si le tableau est vide, il affiche joliment un état vide ("Votre boîte est vide").
- Sinon, il dessine chaque message. Un petit point rouge est ajouté sur l'onglet avec le nombre précis de **messages non lus** (`messages.filter((m) => !m.lu).length`).

---

## 📖 4. La Lecture d'un message (Mise à jour du statut)

Lorsqu'un employé reçoit un nouveau message, il a le badge bleu "Unread" (Non lu).

**1. Le Clic (Frontend)**
- Quand l'utilisateur clique sur la barre du message, deux choses se passent *simultanément* dans la fonction `onClick` :
  1. `setSelectedMessage(msg)` : Ouvre la grande fenêtre Modal pour afficher le texte complet de manière très propre.
  2. `handleMarkRead(msg.id)` : Déclenche le passage en "Lu".

**2. Le Passage en "Lu" (Le Flux)**
- **Astuce visuelle** : Immédiatement, le Frontend change le statut du message à l'écran (le badge devient gris "Read" et la typographie grasse disparaît). Cela évite de faire attendre l'utilisateur.
- **En arrière-plan** : Le Frontend lance discrètement un appel API `PUT /api/messages/read/:id`.
- **Backend (`markAsRead`)** : Le service trouve le message en base de données et passe son champ `lu` de `false` à `true`.
- La prochaine fois que l'utilisateur chargera la page, le serveur se souviendra que le message a été lu.

---

## 🗑️ 5. La Suppression (Bonus)

- L'utilisateur peut cliquer sur l'icône poubelle 🗑️.
- Pour éviter les erreurs, une boîte de dialogue de confirmation (`ConfirmDialog`) s'ouvre : *"Voulez-vous vraiment supprimer ce message ?"*.
- En cas de "Oui", le backend supprime définitivement la ligne dans MongoDB (`Message.findByIdAndDelete`), et le frontend efface la carte du message de l'écran avec une belle animation.
