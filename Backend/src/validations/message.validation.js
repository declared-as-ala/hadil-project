const z = require('zod');
const mongoose = require('mongoose');

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val) && val.length === 24,
  'Invalid ID format'
);

const createMessageSchema = z.object({
  body: z.object({
    expediteurId: objectIdSchema.optional(),
    destinataireId: objectIdSchema.refine((val) => val && val.trim() !== '', 'Recipient ID is required'),
    message: z.string().min(1, 'Message content is required'),
  }),
});

const updateMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message content is required').optional(),
  }),
});

const messageParamsSchema = z.object({
  id: objectIdSchema,
});

const getMessagesSchema = z.object({
  query: z.object({
    expediteurId: objectIdSchema.optional(),
    destinataireId: objectIdSchema.optional(),
    lu: z.string().optional(),
  }).strict(),
});

module.exports = {
  createMessageSchema,
  updateMessageSchema,
  messageParamsSchema,
  getMessagesSchema,
};
