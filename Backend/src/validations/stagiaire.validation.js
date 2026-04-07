const z = require('zod');

const createStagiaireSchema = z.object({
  body: z.object({
    utilisateurId: z.string().min(1, 'Utilisateur ID is required'),
    sujetDeStage: z.string().optional(),
    encadrantId: z.string().optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    status: z.enum(['actif', 'termine', 'annule']).optional(),
  }),
});

const updateStagiaireSchema = z.object({
  body: z.object({
    sujetDeStage: z.string().optional(),
    encadrantId: z.string().optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    status: z.enum(['actif', 'termine', 'annule']).optional(),
  }),
});

const stagiaireParamsSchema = z.object({
  id: z.string().min(1, 'Stagiaire ID is required'),
});

module.exports = {
  createStagiaireSchema,
  updateStagiaireSchema,
  stagiaireParamsSchema,
};
