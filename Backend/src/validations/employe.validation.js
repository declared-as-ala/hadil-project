const { z } = require('zod');

/**
 * Used by Admin when creating a new employee.
 * Backend will auto-create a User account and link it to the Employee profile.
 */
const createEmployeSchema = {
  body: z.object({
    nom: z.string().min(1, 'Last name (nom) is required'),
    prenom: z.string().min(1, 'First name (prenom) is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    poste: z.string().optional(),
    dateEmbauche: z.string().optional(),
    telephone: z.string().optional(),
    salaire_base: z.coerce.number().min(0).optional(),
    prix_heure_sup: z.coerce.number().min(0).optional(),
    status: z.enum(['actif', 'inactif', 'en_conge']).optional(),
  }),
};

/**
 * Used by Admin/RH when editing an existing employee.
 * Email/password updates are not supported here (separate flow if needed).
 */
const updateEmployeSchema = {
  body: z.object({
    nom: z.string().min(1).optional(),
    prenom: z.string().min(1).optional(),
    poste: z.string().optional(),
    dateEmbauche: z.string().optional(),
    telephone: z.string().optional(),
    salaire_base: z.coerce.number().min(0).optional(),
    prix_heure_sup: z.coerce.number().min(0).optional(),
    status: z.enum(['actif', 'inactif', 'en_conge']).optional(),
  }),
};

const employeParamsSchema = {
  params: z.object({
    id: z.string().min(1, 'Employe ID is required'),
  }),
};

module.exports = {
  createEmployeSchema,
  updateEmployeSchema,
  employeParamsSchema,
};
