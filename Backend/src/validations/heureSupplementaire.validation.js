const z = require('zod');

const createHeureSupplementaireSchema = z.object({
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
    heureSupplementaire: z.number().min(0, 'Hours must be >= 0'),
    date: z.string().datetime('Date is required'),
    description: z.string().optional(),
  }),
});

const updateHeureSupplementaireSchema = z.object({
  body: z.object({
    heureSupplementaire: z.number().min(0, 'Hours must be >= 0').optional(),
    date: z.string().datetime().optional(),
    description: z.string().optional(),
  }),
});

const heureSupplementaireParamsSchema = z.object({
  id: z.string().min(1, 'Heure supplementaire ID is required'),
});

module.exports = {
  createHeureSupplementaireSchema,
  updateHeureSupplementaireSchema,
  heureSupplementaireParamsSchema,
};
