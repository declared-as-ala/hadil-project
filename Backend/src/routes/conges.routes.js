const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const congeController = require('../controllers/conge.controller');
const {
  createCongeSchema,
  createCongeAdminSchema,
  updateCongeSchema,
  updateStatusSchema,
  congeParamsSchema,
  prolongerCongeSchema,
} = require('../validations/conge.validation');

// All routes require authentication
router.use(protect);

// ─── Employee-only routes ────────────────────────────────────────────────────

// GET /api/conges/my — Employee sees ONLY their own requests
router.get('/my', authorize('employe'), congeController.getMyConges);

// POST /api/conges — Employee submits a new leave request (no employeId needed)
router.post('/', authorize('employe'), validate(createCongeSchema), congeController.createConge);

// PUT /api/conges/my/:id — Employee modifies their own leave request
router.put('/my/:id', authorize('employe'), validate(congeParamsSchema), validate(updateCongeSchema), congeController.updateCongeForUser);

// ─── Admin / RH routes ──────────────────────────────────────────────────────

// GET /api/conges/stats — Aggregated stats
router.get('/stats', authorize('admin', 'rh'), congeController.getStats);

// GET /api/conges — All requests with filters
router.get('/', authorize('admin', 'rh'), congeController.getAllConges);

// GET /api/conges/:id — Single request detail
router.get('/:id', authorize('admin', 'rh'), validate(congeParamsSchema), congeController.getCongeById);

// POST /api/conges/admin — Admin/RH creates a request for a specific employee
router.post('/admin', authorize('admin', 'rh'), validate(createCongeAdminSchema), congeController.createCongeAdmin);

// PATCH /api/conges/:id/status — Approve or reject
router.patch('/:id/status', authorize('admin', 'rh'), validate(updateStatusSchema), congeController.updateStatus);

// PUT /api/conges/:id — Full update
router.put('/:id', authorize('admin', 'rh'), validate(congeParamsSchema), validate(updateCongeSchema), congeController.updateConge);

// DELETE /api/conges/:id — Admin/RH
router.delete('/:id', authorize('admin', 'rh'), validate(congeParamsSchema), congeController.deleteConge);

// POST /api/conges/:id/prolonger — Extend leave
router.post('/:id/prolonger', authorize('admin', 'rh'), validate(prolongerCongeSchema), congeController.prolongerConge);

module.exports = router;
