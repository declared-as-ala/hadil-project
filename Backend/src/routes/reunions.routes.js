const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const reunionController = require('../controllers/reunion.controller');
const {
  createReunionSchema,
  updateReunionSchema,
  reunionParamsSchema,
} = require('../validations/reunion.validation');

router.use(protect);

// GET /api/reunions - All authenticated
router.get('/', authorize('admin', 'rh', 'employe'), reunionController.getAllReunions);

// GET /api/reunions/:id
router.get('/:id', authorize('admin', 'rh', 'employe'), validate(reunionParamsSchema), reunionController.getReunionById);

// POST /api/reunions - Admin/RH
router.post('/', authorize('admin', 'rh'), validate(createReunionSchema), reunionController.createReunion);

// PUT /api/reunions/:id - Admin/RH
router.put('/:id', authorize('admin', 'rh'), validate(reunionParamsSchema), validate(updateReunionSchema), reunionController.updateReunion);

// DELETE /api/reunions/:id - Admin
router.delete('/:id', authorize('admin'), validate(reunionParamsSchema), reunionController.deleteReunion);

// PUT /api/reunions/:id/assign-project - Assign meeting to project
router.put('/:id/assign-project', authorize('admin', 'rh'), validate(reunionParamsSchema), reunionController.assignReunionToProject);

module.exports = router;
