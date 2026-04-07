const z = require('zod');

const createTacheSchema = z.object({
  body: z.object({
    projetId: z.string().min(1, 'Project ID is required'),
    description: z.string().min(1, 'Description is required'),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional(),
    assigneAId: z.string().optional(),
    priorite: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dateEcheance: z.string().datetime().optional(),
  }),
});

const updateTacheSchema = z.object({
  body: z.object({
    description: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional(),
    assigneAId: z.string().optional(),
    priorite: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dateEcheance: z.string().datetime().optional(),
  }),
});

const tacheParamsSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
});

module.exports = {
  createTacheSchema,
  updateTacheSchema,
  tacheParamsSchema,
};
