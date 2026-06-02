# Diagrammes de séquence — Analyse de CV (Vue générale)

Ces diagrammes sont volontairement **généraux** (sans noms de fichiers) pour montrer le flow fonctionnel : **Frontend → Backend → Stockage/DB → LLM**.

---

## 1) Upload + Analyse d’un CV (flux principal)

```mermaid
sequenceDiagram
    autonumber
    actor RH as Utilisateur RH
    participant UI as Frontend
    participant API as Backend (API)
    participant FS as Stockage fichiers
    participant DB as Base de données
    participant LLM as Fournisseur IA (LLM)

    RH->>UI: Dépose le CV + renseigne critères du poste
    UI->>API: Upload du CV
    API->>FS: Stocke le fichier
    API->>API: Extrait le texte du CV
    API->>DB: Enregistre le CV + texte extrait
    DB-->>API: Identifiant analyse
    API-->>UI: Confirmation (id)

    UI->>API: Demande l'analyse (avec critères du poste)
    API->>DB: Récupère le texte du CV
    API->>LLM: Envoie CV + critères (prompt)
    LLM-->>API: Retour analyse structurée
    API->>API: Normalise / valide le résultat
    API->>DB: Sauvegarde le résultat d'analyse
    API-->>UI: Retourne l'analyse
    UI-->>RH: Affiche score, recommandations, points forts/faibles
```

---

## 2) Consultation d’une analyse (liste + détail)

```mermaid
sequenceDiagram
    autonumber
    actor RH as Utilisateur RH
    participant UI as Frontend
    participant API as Backend (API)
    participant DB as Base de données

    RH->>UI: Ouvre l’écran "Analyseur CV IA"
    UI->>API: Demande la liste (filtres éventuels)
    API->>DB: Récupère les analyses
    API-->>UI: Retourne la liste

    RH->>UI: Clique "Ouvrir" une analyse
    UI->>API: Demande le détail d'une analyse
    API->>DB: Récupère le détail
    API-->>UI: Retourne le détail
    UI-->>RH: Affiche les résultats
```

---

## 3) Chat IA basé sur un CV

```mermaid
sequenceDiagram
    autonumber
    actor RH as Utilisateur RH
    participant UI as Frontend
    participant API as Backend (API)
    participant DB as Base de données
    participant LLM as Fournisseur IA (LLM)

    RH->>UI: Saisit une question
    UI->>API: Envoie la question
    API->>DB: Récupère le contexte (CV + critères)
    API->>LLM: Envoie question + contexte
    LLM-->>API: Répond en texte
    API->>DB: Sauvegarde question/réponse (historique)
    API-->>UI: Retourne la réponse
    UI-->>RH: Affiche la réponse dans le chat
```

---

## 4) Actions RH (pipeline + notes)

```mermaid
sequenceDiagram
    autonumber
    actor RH as Utilisateur RH
    participant UI as Frontend
    participant API as Backend (API)
    participant DB as Base de données

    RH->>UI: Change statut / (dé)sauvegarde pipeline / ajoute une note
    UI->>API: Envoie la mise à jour
    API->>DB: Met à jour le dossier candidat
    API-->>UI: Confirmation
    UI-->>RH: Affiche l'état à jour
```

---

## 5) Export PDF + suppression

```mermaid
sequenceDiagram
    autonumber
    actor RH as Utilisateur RH
    participant UI as Frontend
    participant API as Backend (API)
    participant DB as Base de données
    participant FS as Stockage fichiers

    RH->>UI: Télécharge le PDF
    UI->>API: Demande l'export PDF
    API->>DB: Récupère les données
    API->>API: Génère le PDF
    API-->>UI: Retourne le PDF
    UI-->>RH: Téléchargement

    RH->>UI: Supprime l’analyse
    UI->>API: Demande suppression
    API->>DB: Supprime l'enregistrement
    API->>FS: Supprime le fichier (si présent)
    API-->>UI: Confirmation
    UI-->>RH: Rafraîchit la liste
```
