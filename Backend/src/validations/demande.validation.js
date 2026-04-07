const z = require('zod');

const createDemandeSchema = z.object({
  body: z.object({
    sujet: z.string().min(1, 'Subject is required'),
    description: z.string().optional(),
    employeId: z.string().min(1, 'Employe ID is required'),
  }),
});

const updateDemandeSchema = z.object({
  body: z.object({
    sujet: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'accepted', 'rejected', 'resolved']).optional(),
    reponse: z.string().optional(),
  }),
});

const demandeParamsSchema = z.object({
  id: z.string().min(1, 'Demande ID is required'),
});

module.exports = {
  createDemandeSchema,
  updateDemandeSchema,
  demandeParamsSchema,
};
