const { z } = require('zod');

const updateRoleSchema = {
  body: z.object({
    role: z.enum(['admin', 'rh', 'employe', 'stagiaire'], {
      errorMap: () => ({ message: 'Role must be one of: admin, rh, employe, stagiaire' }),
    }),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
};

const userParamsSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
};

module.exports = {
  updateRoleSchema,
  userParamsSchema,
};
