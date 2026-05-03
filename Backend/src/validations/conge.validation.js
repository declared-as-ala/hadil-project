const z = require('zod');

const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'special'];
const STATUSES = ['pending', 'approved', 'rejected'];

const leaveTypeEnum = z.enum(LEAVE_TYPES, { errorMap: () => ({ message: 'Invalid leave type' }) });
const statusEnum = z.enum(STATUSES, { errorMap: () => ({ message: 'Status must be pending, approved, or rejected' }) });
const idSchema = z.object({ id: z.string().min(1, 'Leave request ID is required') });

/**
 * Employee creates their own leave request — no employeId field
 */
const createCongeSchema = {
  body: z.object({
    date_debut: z.string().min(1, 'Start date is required'),
    periode: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int()
      .min(1, 'Duration must be at least 1 day'),
    type_conge: leaveTypeEnum,
    motif: z.string().max(500).optional(),
  }),
};

/**
 * Admin/RH creates a leave request for a specific employee
 */
const createCongeAdminSchema = {
  body: z.object({
    employeId: z.string().min(1, 'Employee ID is required'),
    date_debut: z.string().min(1, 'Start date is required'),
    periode: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int()
      .min(1, 'Duration must be at least 1 day'),
    type_conge: leaveTypeEnum,
    motif: z.string().max(500).optional(),
  }),
};

/**
 * Admin/RH updates status (approve / reject)
 */
const updateStatusSchema = {
  params: idSchema,
  body: z.object({
    status: statusEnum,
  }),
};

const updateCongeSchema = {
  params: idSchema,
  body: z.object({
    date_debut: z.string().optional(),
    periode: z.number().int().min(1).optional(),
    type_conge: leaveTypeEnum.optional(),
    status: statusEnum.optional(),
    motif: z.string().max(500).optional(),
  }),
};

const congeParamsSchema = {
  params: idSchema,
};

const prolongerCongeSchema = {
  params: idSchema,
  body: z.object({
    joursSupplementaires: z
      .number({ invalid_type_error: 'Must be a number' })
      .int()
      .min(1, 'Extension must be at least 1 day'),
  }),
};

module.exports = {
  createCongeSchema,
  createCongeAdminSchema,
  updateStatusSchema,
  updateCongeSchema,
  congeParamsSchema,
  prolongerCongeSchema,
};
