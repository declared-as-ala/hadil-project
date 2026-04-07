const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const congeController = require('../controllers/conge.controller');
const {
  createCongeSchema,
  updateCongeSchema,
  congeParamsSchema,
  prolongerCongeSchema,
} = require('../validations/conge.validation');

router.use(protect);

// GET /api/conges - Admin/RH/Employe
router.get('/', authorize('admin', 'rh', 'employe'), congeController.getAllConges);

// GET /api/conges/:id - Admin/RH
router.get('/:id', authorize('admin', 'rh'), validate(congeParamsSchema), congeController.getCongeById);

// POST /api/conges - Employe (can request own conge)
router.post('/', authorize('employe'), validate(createCongeSchema), congeController.createConge);

// PUT /api/conges/:id - Admin/RH (approve/reject)
router.put('/:id', authorize('admin', 'rh'), validate(congeParamsSchema), validate(updateCongeSchema), congeController.updateConge);

// DELETE /api/conges/:id - Admin
router.delete('/:id', authorize('admin'), validate(congeParamsSchema), congeController.deleteConge);

// POST /api/conges/:id/prolonger - Admin/RH
router.post('/:id/prolonger', authorize('admin', 'rh'), validate(prolongerCongeSchema), congeController.prolongerConge);

module.exports = router;
