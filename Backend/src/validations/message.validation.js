const z = require('zod');

const createMessageSchema = z.object({
  body: z.object({
    expediteurId: z.string().min(1, 'Sender ID is required'),
    destinataireId: z.string().min(1, 'Recipient ID is required'),
    message: z.string().min(1, 'Message content is required'),
  }),
});

const updateMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message content is required').optional(),
  }),
});

const messageParamsSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
});

const getMessagesSchema = z.object({
  query: z.object({
    expediteurId: z.string().optional(),
    destinataireId: z.string().optional(),
  }),
});

module.exports = {
  createMessageSchema,
  updateMessageSchema,
  messageParamsSchema,
  getMessagesSchema,
};
