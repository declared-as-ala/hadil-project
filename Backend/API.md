# HR Management System - API Documentation

## Overview

This is the HR Management System backend API, built on top of an existing authentication system using Express.js, MongoDB (Mongoose), and Zod validation.

### Base URL
```
http://localhost:5000/api
```

### Authentication
All HR endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable message",
  "statusCode": 200
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ],
  "statusCode": 400
}
```

---

## Role-Based Access Control

| Role | Access Level |
|------|-------------|
| `admin` | Full access to all endpoints |
| `rh` | Manage employees, contrats, absences, conges, demandes |
| `employe` | View own data, create demandes/conges |
| `stagiaire` | Send messages, request assistance |

---

## 1. Authentication (Existing)

### Register
```
POST /api/auth/signup
```
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "adresse": "123 Main St",
  "password": "securepassword"
}
```

### Login
```
POST /api/auth/login
```
```json
{
  "email": "jean@example.com",
  "password": "securepassword"
}
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

---

## 2. Employes (Employees)

**Roles:** Admin, RH

### GET /api/employes
Get all employees with optional filters.
```
GET /api/employes?status=actif&departement=IT
```

### GET /api/employes/:id
```
GET /api/employes/64f5a1b2c3d4e5f6a7b8c9d0
```

### POST /api/employes
Create a new employee (link to existing User).
```json
{
  "utilisateurId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "poste": "Developpeur Senior",
  "departement": "IT",
  "dateEmbauche": "2024-01-15T00:00:00.000Z",
  "telephone": "+1234567890",
  "status": "actif"
}
```

### PUT /api/employes/:id
```json
{
  "poste": "Lead Developer",
  "status": "en_conge"
}
```

### DELETE /api/employes/:id
**Role:** Admin only

---

## 3. Stagiaires (Interns)

**Roles:** Admin, RH

### GET /api/stagiaires
```
GET /api/stagiaires?status=actif
```

### POST /api/stagiaires
```json
{
  "utilisateurId": "64f5a1b2c3d4e5f6a7b8c9d1",
  "sujetDeStage": "Developpement application web",
  "encadrantId": "64f5a1b2c3d4e5f6a7b8c9d2",
  "dateDebut": "2024-01-01T00:00:00.000Z",
  "dateFin": "2024-06-30T00:00:00.000Z",
  "status": "actif"
}
```

### PUT /api/stagiaires/:id
```json
{
  "sujetDeStage": "Nouveau sujet de stage",
  "status": "termine"
}
```

### DELETE /api/stagiaires/:id
**Role:** Admin only

### POST /api/stagiaires/:stagiaireId/encadrant
Assign a supervisor (encadrant) to an intern.
```json
{
  "encadrantId": "64f5a1b2c3d4e5f6a7b8c9d2"
}
```

### POST /api/stagiaires/:stagiaireId/assistance
**Role:** Stagiaire - Request assistance from encadrant.
```json
{
  "message": "J'ai besoin d'aide avec l'implementation de l'API"
}
```

### PUT /api/stagiaires/:stagiaireId/sujet
Update the intern's stage subject.
```json
{
  "sujet": "Migration vers une architecture microservices"
}
```

---

## 4. Absences

**Roles:** Admin, RH

### GET /api/absences
```
GET /api/absences?employeId=xxx&dateFrom=2024-01-01&dateTo=2024-12-31
```

### POST /api/absences
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "date": "2024-02-15T00:00:00.000Z",
  "nombre_des_heures": 8,
  "raison": "Maladie"
}
```

### PUT /api/absences/:id
```json
{
  "nombre_des_heures": 6,
  "raison": "Maladie (updated)"
}
```

### DELETE /api/absences/:id
**Role:** Admin only

---

## 5. Demandes & Reclamations

**Roles:** Admin, RH (manage), Employe (create)

### GET /api/demandes
```
GET /api/demandes?status=pending&employeId=xxx
```

### GET /api/demandes/consult
Consult all demandes (Admin/RH).

### POST /api/demandes
**Role:** Employe
```json
{
  "sujet": "Demande de formation",
  "description": "Je souhaite suivre une formation en React",
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0"
}
```

### PUT /api/demandes/:id
Update status or add response (Admin/RH).
```json
{
  "status": "accepted",
  "reponse": "Votre demande a ete acceptee. Budget alloue."
}
```

### DELETE /api/demandes/:id
**Role:** Admin only

---

## 6. Conges (Leaves)

**Roles:** Admin, RH (manage), Employe (create)

### GET /api/conges
```
GET /api/conges?status=pending&type_conge=annual&employeId=xxx
```

### POST /api/conges
**Role:** Employe
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "date_debut": "2024-07-01T00:00:00.000Z",
  "periode": 14,
  "type_conge": "annual",
  "motif": "Vacances d'ete"
}
```

### PUT /api/conges/:id
Approve/reject (Admin/RH).
```json
{
  "status": "approved"
}
```

### DELETE /api/conges/:id
**Role:** Admin only

### POST /api/conges/:id/prolonger
Extend a leave by additional days (Admin/RH).
```json
{
  "joursSupplementaires": 5
}
```

---

## 7. Heures Supplementaires (Overtime)

**Roles:** Admin, RH

### GET /api/heures-supplementaires
```
GET /api/heures-supplementaires?employeId=xxx&dateFrom=2024-01-01
```

### POST /api/heures-supplementaires
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "heureSupplementaire": 5,
  "date": "2024-02-20T00:00:00.000Z",
  "description": "Urgence projet - deadline"
}
```

### PUT /api/heures-supplementaires/:id
```json
{
  "heureSupplementaire": 6,
  "description": "Updated description"
}
```

### DELETE /api/heures-supplementaires/:id
**Role:** Admin only

---

## 8. Messages

**Roles:** All authenticated users

### GET /api/messages
Get all messages with optional filters.
```
GET /api/messages?expediteurId=xxx&destinataireId=xxx&lu=false
```

### GET /api/messages/receive/:destinataireId
Get unread messages for a recipient.

### POST /api/messages
Send a message.
```json
{
  "expediteurId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "destinataireId": "64f5a1b2c3d4e5f6a7b8c9d2",
  "message": "Bonjour, pouvez-vous m'envoyer le rapport du projet?"
}
```

### POST /api/messages/envoyer
Alias for sending a message (same payload).

### PUT /api/messages/:id
Modify a sent message.
```json
{
  "message": "Updated message content"
}
```

### PUT /api/messages/:id/read
Mark a message as read (no body needed).

### DELETE /api/messages/:id
Delete a message.

---

## 9. Projets (Projects)

**Roles:** Admin (manage), Employe (view)

### GET /api/projets
```
GET /api/projets?status=in_progress
```

### POST /api/projets
**Role:** Admin
```json
{
  "nom": "Projet HR System",
  "description": "Developpement du systeme de gestion RH",
  "status": "in_progress",
  "dateDebut": "2024-01-01T00:00:00.000Z",
  "dateFin": "2024-12-31T00:00:00.000Z",
  "chefDeProjetId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "membresIds": ["64f5a1b2c3d4e5f6a7b8c9d2", "64f5a1b2c3d4e5f6a7b8c9d3"]
}
```

### PUT /api/projets/:id
```json
{
  "status": "completed",
  "description": "Projet termine avec succes"
}
```

### DELETE /api/projets/:id
**Role:** Admin only

### POST /api/projets/:id/members
Assign an employee to a project.
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d4"
}
```

### DELETE /api/projets/:id/members
Remove an employee from a project.
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d4"
}
```

---

## 10. Taches (Tasks)

**Roles:** Admin, RH (manage), Employe (view)

### GET /api/taches
```
GET /api/taches?projetId=xxx&status=in_progress&priorite=high&assigneAId=xxx
```

### POST /api/taches
```json
{
  "projetId": "64f5a1b2c3d4e5f6a7b8c9e0",
  "description": "Implementer l'API d'authentication",
  "status": "not_started",
  "assigneAId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "priorite": "high",
  "dateEcheance": "2024-03-01T00:00:00.000Z"
}
```

### PUT /api/taches/:id
```json
{
  "status": "in_progress",
  "priorite": "urgent"
}
```

### DELETE /api/taches/:id
**Role:** Admin only

### PUT /api/taches/:id/assign-project
Reassign a task to a different project.
```json
{
  "projetId": "64f5a1b2c3d4e5f6a7b8c9e1"
}
```

---

## 11. Reunions (Meetings)

**Roles:** Admin, RH (manage), Employe (view)

### GET /api/reunions
```
GET /api/reunions?projetId=xxx&dateFrom=2024-01-01&dateTo=2024-12-31
```

### POST /api/reunions
```json
{
  "projetId": "64f5a1b2c3d4e5f6a7b8c9e0",
  "date_debut": "2024-04-01T10:00:00.000Z",
  "date_fin": "2024-04-01T11:00:00.000Z",
  "description": "Reunion de lancement du sprint 2",
  "lieu": "Salle de conference A",
  "participantsIds": ["64f5a1b2c3d4e5f6a7b8c9d0", "64f5a1b2c3d4e5f6a7b8c9d2"],
  "organisateurId": "64f5a1b2c3d4e5f6a7b8c9d0"
}
```

### PUT /api/reunions/:id
```json
{
  "lieu": "Salle B (changed)",
  "description": "Updated agenda"
}
```

### DELETE /api/reunions/:id
**Role:** Admin only

### PUT /api/reunions/:id/assign-project
Assign meeting to a different project.
```json
{
  "projetId": "64f5a1b2c3d4e5f6a7b8c9e1"
}
```

---

## 12. Contrats (Contracts)

**Roles:** Admin, RH

### GET /api/contrats
```
GET /api/contrats?type=CDI&status=actif&employeId=xxx
```

### POST /api/contrats
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "type": "CDI",
  "salaire": 50000,
  "clausesGeneral": "Clauses standards du contrat",
  "posteTravail": "Developpeur Full Stack",
  "date_de_debut": "2024-01-15T00:00:00.000Z",
  "periode_essai": 3
}
```

For **CDD** contracts, include `date_de_fin`:
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "type": "CDD",
  "salaire": 45000,
  "date_de_debut": "2024-01-15T00:00:00.000Z",
  "date_de_fin": "2024-07-15T00:00:00.000Z",
  "periode_essai": 2
}
```

For **CIVP** contracts:
```json
{
  "employeId": "64f5a1b2c3d4e5f6a7b8c9d0",
  "type": "CIVP",
  "salaire": 30000,
  "date_de_debut": "2024-01-15T00:00:00.000Z",
  "periode_essai": 1
}
```

### PUT /api/contrats/:id
```json
{
  "salaire": 55000,
  "status": "actif"
}
```

### DELETE /api/contrats/:id
**Role:** Admin only

### POST /api/contrats/:id/renouveler
Renew a contract. For CDD, this extends the end date.
```json
{
  "notes": "Renouvellement pour performance excellente"
}
```

---

## 13. Users (NEW - Role Management)

**Role Management API - Admin Only** ✨

### Important: Automatic Role Assignment
- When a user signs up via `/api/auth/signup`, the role is **automatically set to `employe`**
- Only admins can change user roles via the API below

### GET /api/users
**Role:** Admin only

Get all users in the system.

```
GET /api/users
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "fullName": "Admin User",
        "email": "admin@example.com",
        "role": "admin",
        "createdAt": "2024-04-27T10:00:00Z"
      },
      {
        "id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "fullName": "RH User",
        "email": "rh@example.com",
        "role": "rh",
        "createdAt": "2024-04-27T10:05:00Z"
      }
    ],
    "count": 2
  }
}
```

---

### GET /api/users/:id
**Role:** Admin only

Get a specific user's information.

```
GET /api/users/64f5a1b2c3d4e5f6a7b8c9d0
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2024-04-27T10:00:00Z"
    }
  }
}
```

---

### PUT /api/users/:id/role ⭐
**Role:** Admin only

**Change a user's role (admin, rh, employe, stagiaire)**

```
PUT /api/users/64f5a1b2c3d4e5f6a7b8c9d0/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "rh"
}
```

**Valid roles:**
- `admin` - Full system access
- `rh` - HR management access
- `employe` - Employee access
- `stagiaire` - Intern access

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User role updated to rh",
  "data": {
    "user": {
      "id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "rh",
      "createdAt": "2024-04-27T10:00:00Z"
    }
  }
}
```

**Error Responses:**

❌ `400 Bad Request` - Invalid role
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": ["body", "role"],
      "message": "Role must be one of: admin, rh, employe, stagiaire"
    }
  ]
}
```

❌ `403 Forbidden` - Cannot change own role
```json
{
  "success": false,
  "message": "You cannot change your own role"
}
```

❌ `403 Forbidden` - Not admin
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

❌ `404 Not Found` - User doesn't exist
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### DELETE /api/users/:id
**Role:** Admin only

Delete a user from the system.

```
DELETE /api/users/64f5a1b2c3d4e5f6a7b8c9d1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**

❌ `403 Forbidden` - Cannot delete own account
```json
{
  "success": false,
  "message": "You cannot delete your own account"
}
```

❌ `404 Not Found` - User doesn't exist
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Quick Start / Testing Flow

### 1. Seed the database
```bash
npm run seed
```

### 2. Login and get token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hr.com","password":"password123"}'
```

Copy the `accessToken` from the response.

### 3. Use the token for authenticated requests
```bash
curl http://localhost:5000/api/employes \
  -H "Authorization: Bearer <your_token>"
```

### 4. Test role-based access
Try accessing admin-only endpoints with an employe token - you'll get a 403 Forbidden error.

### 5. Change a user's role (Admin only)
```bash
curl -X PUT http://localhost:5000/api/users/<user_id>/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "rh"}'
```

---

## Database Design Summary

| Collection | Key Relationships |
|-----------|------------------|
| `users` | Base entity with auth + role |
| `employes` | References `utilisateur` (User); has many absences, conges, demandes, heures, contrats, messages |
| `stagiaires` | References `utilisateur` (User) + `encadrant` (Employe) |
| `absences` | References `employe` |
| `demandes` | References `employe` |
| `conges` | References `employe` |
| `heuresSupplementaires` | References `employe` |
| `messages` | References `expediteur` (Employe) + `destinataire` (Employe) |
| `projets` | References `chefDeProjet` (Employe) + `membres` [Employe] |
| `taches` | References `projet` + `assigneA` (Employe) |
| `reunions` | References `projet` + `participants` [Employe] + `organisateur` (Employe) |
| `contrats` | References `employe`; supports CDI/CDD/CIVP via `type` field |

---

## Design Decisions

1. **Contract Inheritance**: Instead of separate collections, contracts use a `type` field (CDI, CDD, CIVP) with optional `date_de_fin` (only for CDD). This is simpler and more scalable in MongoDB.

2. **Employe-User Relationship**: Each Employe references a User document (one-to-one). This keeps auth concerns separate from HR data while maintaining the Utilisateur pattern from the UML.

3. **Virtual Populate**: Models use Mongoose virtuals for related data (e.g., `employe.absences`), which can be populated on demand for cleaner API responses.

4. **Role Hierarchy**: `admin` has the most access, `rh` manages HR data, `employe` can view own data and create requests, `stagiaire` has limited access.

5. **Status Enums**: All entities use meaningful enum values instead of booleans for better state management.
