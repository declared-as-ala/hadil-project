const z = require('zod');

const createCongeSchema = z.object({
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
    date_debut: z.string().datetime('Start date is required'),
    periode: z.number().min(1, 'Period must be at least 1 day'),
    type_conge: z.enum(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'special']),
    motif: z.string().optional(),
  }),
});

const updateCongeSchema = z.object({
  body: z.object({
    date_debut: z.string().datetime().optional(),
    periode: z.number().min(1, 'Period must be at least 1 day').optional(),
    type_conge: z.enum(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'special']).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    motif: z.string().optional(),
  }),
});

const congeParamsSchema = z.object({
  id: z.string().min(1, 'Conge ID is required'),
});

const prolongerCongeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Conge ID is required'),
  }),
  body: z.object({
    joursSupplementaires: z.number().min(1, 'Extension must be at least 1 day'),
  }),
});

module.exports = {
  createCongeSchema,
  updateCongeSchema,
  congeParamsSchema,
  prolongerCongeSchema,
};
