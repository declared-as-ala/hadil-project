const z = require('zod');

const createProjetSchema = z.object({
  body: z.object({
    nom: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    chefDeProjetId: z.string().optional(),
    membresIds: z.array(z.string()).optional(),
  }),
});

const updateProjetSchema = z.object({
  body: z.object({
    nom: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    chefDeProjetId: z.string().optional(),
    membresIds: z.array(z.string()).optional(),
  }),
});

const projetParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

const assignMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Project ID is required'),
  }),
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
  }),
});

module.exports = {
  createProjetSchema,
  updateProjetSchema,
  projetParamsSchema,
  assignMemberSchema,
};
