const z = require('zod');

const createReunionSchema = z.object({
  body: z.object({
    projetId: z.string().min(1, 'Project ID is required'),
    date_debut: z.string().datetime('Start date is required'),
    date_fin: z.string().datetime('End date is required'),
    description: z.string().optional(),
    lieu: z.string().optional(),
    participantsIds: z.array(z.string()).optional(),
    organisateurId: z.string().optional(),
  }).refine((data) => new Date(data.date_fin) > new Date(data.date_debut), {
    message: 'End date must be after start date',
  }),
});

const updateReunionSchema = z.object({
  body: z.object({
    date_debut: z.string().datetime().optional(),
    date_fin: z.string().datetime().optional(),
    description: z.string().optional(),
    lieu: z.string().optional(),
    participantsIds: z.array(z.string()).optional(),
    organisateurId: z.string().optional(),
  }),
});

const reunionParamsSchema = z.object({
  id: z.string().min(1, 'Reunion ID is required'),
});

module.exports = {
  createReunionSchema,
  updateReunionSchema,
  reunionParamsSchema,
};
