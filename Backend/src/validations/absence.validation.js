const z = require('zod');

const createAbsenceSchema = z.object({
  body: z.object({
    employeId: z.string().min(1, 'Employe ID is required'),
    date: z.string().datetime('Date is required'),
    nombre_des_heures: z.number().min(0, 'Hours must be >= 0'),
    raison: z.string().optional(),
  }),
});

const updateAbsenceSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    nombre_des_heures: z.number().min(0, 'Hours must be >= 0').optional(),
    raison: z.string().optional(),
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
