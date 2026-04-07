const z = require('zod');

const createEmployeSchema = z.object({
  body: z.object({
    utilisateurId: z.string().min(1, 'Utilisateur ID is required'),
    poste: z.string().optional(),
    departement: z.string().optional(),
    dateEmbauche: z.string().datetime().optional(),
    telephone: z.string().optional(),
    status: z.enum(['actif', 'inactif', 'en_conge']).optional(),
  }),
});

const updateEmployeSchema = z.object({
  body: z.object({
    poste: z.string().optional(),
    departement: z.string().optional(),
    dateEmbauche: z.string().datetime().optional(),
    telephone: z.string().optional(),
    status: z.enum(['actif', 'inactif', 'en_conge']).optional(),
  }),
});

const employeParamsSchema = z.object({
  id: z.string().min(1, 'Employe ID is required'),
});

module.exports = {
  createEmployeSchema,
  updateEmployeSchema,
  employeParamsSchema,
};
