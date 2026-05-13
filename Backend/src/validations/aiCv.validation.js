const z = require('zod');

const objectId = z.string().min(1, 'ID is required');

const aiCvParamsSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

const analyzeCvSchema = z.object({
  body: z.object({
    jobTitle: z.string().optional(),
    jobDescription: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    experienceLevel: z.string().optional(),
    languageRequirements: z.array(z.string()).optional(),
  }),
});

const chatSchema = z.object({
  body: z.object({
    question: z.string().min(1, 'Question is required'),
  }),
});

const listSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    recommendation: z.enum(['strong_match', 'possible_match', 'weak_match']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    minScore: z.string().optional(),
    maxScore: z.string().optional(),
  }),
});

const updatePipelineSchema = z.object({
  body: z.object({
    pipelineStatus: z.enum(['pending', 'shortlisted', 'rejected']).optional(),
    savedToPipeline: z.boolean().optional(),
    note: z.string().max(1000).optional(),
  }),
});

module.exports = {
  aiCvParamsSchema,
  analyzeCvSchema,
  chatSchema,
  listSchema,
  updatePipelineSchema,
};
