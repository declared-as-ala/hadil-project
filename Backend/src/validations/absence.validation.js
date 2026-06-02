const z = require('zod');

const createAbsenceSchema = z.object({
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
    date: z.string(),
    nombre_des_heures: z.coerce.number().min(0),
    raison: z.string().optional(),
    statut: z.enum(['justifié', 'non_justifié']).optional(),
  }),
});

const updateAbsenceSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    nombre_des_heures: z.coerce.number().min(0).optional(),
    raison: z.string().optional(),
    statut: z.enum(['justifié', 'non_justifié']).optional(),
  }),
});

const absenceParamsSchema = z.object({
  id: z.string().min(1, 'Absence ID is required'),
});

module.exports = {
  createAbsenceSchema,
  updateAbsenceSchema,
  absenceParamsSchema,
};
