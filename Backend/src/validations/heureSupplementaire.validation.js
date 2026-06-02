const z = require('zod');

const createHeureSupplementaireSchema = z.object({
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
    heureSupplementaire: z.coerce.number().min(0, 'Hours must be >= 0'),
    date: z.string().min(1, 'Date is required'),
    description: z.string().optional(),
  }),
});

const updateHeureSupplementaireSchema = z.object({
  body: z.object({
    heureSupplementaire: z.coerce.number().min(0, 'Hours must be >= 0').optional(),
    date: z.string().min(1).optional(),
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
