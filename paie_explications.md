# 📘 Explication Complète — Gestion de Paie

## 🏗️ Ce qui a été construit

### Architecture en couches (pattern utilisé partout dans le projet)

```
Frontend (React)
    ↓  API call (axios)
Backend Route (Express)
    ↓  vérifie JWT + rôle
Controller
    ↓  appelle
Service (logique métier)
    ↓  accède à
Model (MongoDB via Mongoose)
```

---

## 📦 Étape 1 — Les Modèles (Base de données)

### `Poste.model.js`
Représente un **poste de travail** dans l'entreprise.

```js
{
  nom_poste: "Developpeur Senior",  // nom du poste
  salaire_base: 2500,               // salaire mensuel fixe en DT
  prix_heure_sup: 25                // prix d'une heure supplémentaire en DT
}
```

### `Affectation.model.js`
**Lie un employé à un poste** avec des dates. Un employé peut changer de poste — l'historique est conservé.

```js
{
  employe: ObjectId,      // référence vers Employe
  poste: ObjectId,        // référence vers Poste
  date_debut: Date,       // quand l'affectation a commencé
  date_fin: null          // null = affectation ACTIVE, sinon date de fin
}
```
> 💡 `date_fin: null` = poste actuel de l'employé

### `Paie.model.js`
La **fiche de paie mensuelle** calculée et sauvegardée.

```js
{
  employe: ObjectId,
  poste: ObjectId,
  mois: 5,               // Mai
  annee: 2026,
  salaire_base: 2500,
  total_heures_sup: 8,   // total heures sup du mois
  prix_heure_sup: 25,
  montant_heures_sup: 200,    // 8 × 25
  salaire_total: 2700         // 2500 + 200
}
```
> 🔒 Index unique sur `(employe, mois, annee)` → une seule fiche par mois

---

## ⚙️ Étape 2 — Les Services (Logique Métier)

### `poste.service.js`
CRUD simple :
- `getAllPostes()` → liste tous les postes
- `createPoste(data)` → crée un nouveau poste
- `updatePoste(id, data)` → modifie salaire/prix HS
- `deletePoste(id)` → supprime un poste

### `affectation.service.js`
Logique plus complexe :

**`createAffectation(data)`**
```
1. Ferme l'ancienne affectation active (date_fin = date_debut_nouvelle)
2. Crée la nouvelle affectation
→ Garantit qu'un employé a toujours un seul poste ACTIF
```

**`syncFromEmployes()`** ← nouvelle fonctionnalité
```
Pour chaque employé ayant un champ "poste" (string) :
  1. Ignore si c'est un rôle ("employe", "admin", "rh"...)
  2. Cherche si un Poste avec ce nom existe déjà
  3. Sinon → crée le Poste (salaire_base = 0 à remplir manuellement)
  4. Vérifie si l'employé a déjà une affectation active
  5. Sinon → crée l'Affectation avec date_debut = dateEmbauche
```

### `paie.service.js`
Le cœur du système :

**`calculerSalaire(employeId, mois, annee)`**
```
1. Trouve l'affectation active de l'employé (date_fin: null)
2. Récupère le Poste → salaire_base, prix_heure_sup
3. Cherche les HeureSupplementaire du mois
4. Calcule :
   - total_heures_sup = somme de toutes les HS du mois
   - montant_heures_sup = total_heures_sup × prix_heure_sup
   - salaire_total = salaire_base + montant_heures_sup
5. Retourne les données (sans sauvegarder)
```

**`genererPaie(employeId, mois, annee)`**
```
1. Appelle calculerSalaire()
2. Sauvegarde en base (upsert → crée ou met à jour si déjà existant)
3. Retourne la fiche complète
```

**`genererToutesPaies(mois, annee)`**
```
1. Récupère toutes les affectations actives (date_fin: null)
2. Pour chaque employé → genererPaie()
3. Ignore silencieusement les erreurs (ex: pas de poste affecté)
4. Retourne la liste de toutes les fiches générées
```

### `employe.service.js` — Suppression en cascade (fix ajouté)
```
deleteEmploye(id) :
  1. Supprime ses Affectations
  2. Supprime ses Paies
  3. Supprime ses Absences
  4. Supprime ses Congés
  5. Supprime ses HeuresSupplementaires
  6. Supprime l'Employe
→ Aucune donnée orpheline ne reste en base
```

---

## 🔌 Étape 3 — Les Routes (API)

### `/api/postes`
| Méthode | URL | Rôle requis | Action |
|---|---|---|---|
| GET | `/api/postes` | admin/rh/employe | Liste des postes |
| POST | `/api/postes` | admin/rh | Créer un poste |
| PUT | `/api/postes/:id` | admin/rh | Modifier un poste |
| DELETE | `/api/postes/:id` | admin | Supprimer un poste |

### `/api/affectations`
| Méthode | URL | Rôle requis | Action |
|---|---|---|---|
| GET | `/api/affectations` | admin/rh | Toutes les affectations |
| POST | `/api/affectations` | admin/rh | Créer une affectation |
| POST | `/api/affectations/sync` | admin/rh | **Sync depuis employés existants** |
| DELETE | `/api/affectations/:id` | admin/rh | Supprimer |

### `/api/paies`
| Méthode | URL | Rôle requis | Action |
|---|---|---|---|
| GET | `/api/paies` | admin/rh | Toutes les fiches |
| GET | `/api/paies/mes-paies` | employe | Ses propres fiches |
| GET | `/api/paies/document` | tous | Données pour fiche de paie PDF |
| GET | `/api/paies/calculer` | admin/rh | Prévisualiser le salaire |
| POST | `/api/paies/generer` | admin/rh | Générer pour 1 employé |
| POST | `/api/paies/generer-toutes` | admin/rh | **Générer pour tous** |
| DELETE | `/api/paies/:id` | admin | Supprimer une fiche |

---

## 🖥️ Étape 4 — Le Frontend

### Page `/paie` — Vue Admin (RH/Admin)

**Onglet 💰 Fiches de paie**
```
1. Choisir mois + année
2. Cliquer "Afficher" → GET /api/paies?mois=5&annee=2026
3. Cliquer "⚡ Générer toutes" → POST /api/paies/generer-toutes
4. Tableau affiche : employé, poste, salaire base, HS, montant HS, total
```

**Onglet 🏷️ Postes**
```
- Liste des postes avec salaires
- "✏️ Modifier" → édition inline → PUT /api/postes/:id
- "+ Nouveau poste" → formulaire → POST /api/postes
- "🗑️ Supprimer" → DELETE /api/postes/:id
```

**Onglet 🔗 Affectations**
```
- "🔄 Sync depuis employés" → POST /api/affectations/sync
  → Lit le champ "poste" de chaque employé existant
  → Crée Postes + Affectations automatiquement
  → Ignore les valeurs "employe", "admin", "rh" (ce sont des rôles)

- "+ Nouvelle affectation" → formulaire manuel
  → Sélectionner un employé + un poste + date début
  → POST /api/affectations
```

### Page `/paie` — Vue Employé
```
→ GET /api/paies/mes-paies
→ Affiche des cartes par mois avec :
   - Poste occupé
   - Salaire de base
   - Heures supplémentaires
   - Montant HS
   - Total à payer
```

### Page `/documents-admin` — Fiche de paie PDF
```
Quand l'employé demande une "fiche de paie" :
1. L'admin/RH ouvre le modal de prévisualisation
2. Le frontend appelle GET /api/paies/document?employeId=...&mois=...&annee=...
3. Si une fiche existe → affiche les données sauvegardées
4. Si aucune fiche → calcule à la volée (sans sauvegarder)
5. Le modal affiche le tableau complet salaire + bouton "Imprimer PDF"
```

---

## 🔄 Flow complet — De zéro à la fiche de paie

```
ADMIN
  │
  ├─ 1. Crée des Postes (ou Sync depuis employés existants)
  │       ↓ POST /api/postes  (ou POST /api/affectations/sync)
  │
  ├─ 2. Affecte chaque employé à son poste
  │       ↓ POST /api/affectations
  │       (l'ancienne affectation est auto-fermée)
  │
  ├─ 3. Met à jour les salaires des postes créés par sync (ils sont à 0 DT)
  │       ↓ PUT /api/postes/:id
  │
  └─ 4. Génère les paies du mois
          ↓ POST /api/paies/generer-toutes {mois, annee}
          → Pour chaque affectation active :
            - Récupère les heures sup du mois
            - Calcule salaire_total = base + (HS × prix)
            - Sauvegarde en base

EMPLOYÉ
  └─ 5. Consulte ses fiches sur /paie
          ↓ GET /api/paies/mes-paies
          → Voit toutes ses fiches par mois

  └─ 6. Demande une fiche de paie PDF sur /documents-admin
          → L'admin approuve
          → Le document est téléchargeable avec toutes les données salariales
```

---

## 🛡️ Suppression en cascade

Quand un **employé est supprimé** :
```
Employe supprimé
    ├─ → Affectations supprimées (toutes)
    ├─ → Paies supprimées (toutes)
    ├─ → Absences supprimées (toutes)
    ├─ → Congés supprimés (tous)
    └─ → HeuresSupplementaires supprimées (toutes)
```
> Aucune donnée "fantôme" ne reste en base de données.
