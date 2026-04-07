const z = require('zod');

const createContratSchema = z.object({
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
    type: z.enum(['CDI', 'CDD', 'CIVP']),
    salaire: z.number().min(0, 'Salary must be >= 0'),
    clausesGeneral: z.string().optional(),
    posteTravail: z.string().optional(),
    date_de_debut: z.string().datetime('Start date is required'),
    date_de_fin: z.string().datetime().optional(),
    periode_essai: z.number().min(0, 'Trial period must be >= 0').optional(),
  }),
});

const updateContratSchema = z.object({
  body: z.object({
    type: z.enum(['CDI', 'CDD', 'CIVP']).optional(),
    salaire: z.number().min(0, 'Salary must be >= 0').optional(),
    clausesGeneral: z.string().optional(),
    posteTravail: z.string().optional(),
    date_de_debut: z.string().datetime().optional(),
    date_de_fin: z.string().datetime().optional(),
    periode_essai: z.number().min(0, 'Trial period must be >= 0').optional(),
    status: z.enum(['actif', 'expire', 'resilie', 'en_attente']).optional(),
  }),
});

const contratParamsSchema = z.object({
  id: z.string().min(1, 'Contrat ID is required'),
});

const renouvelerContratSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Contrat ID is required'),
  }),
  body: z.object({
    notes: z.string().optional(),
  }),
});

module.exports = {
  createContratSchema,
  updateContratSchema,
  contratParamsSchema,
  renouvelerContratSchema,
};
