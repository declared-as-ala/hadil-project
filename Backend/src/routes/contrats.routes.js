const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const contratController = require('../controllers/contrat.controller');
const {
  createContratSchema,
  updateContratSchema,
  contratParamsSchema,
  renouvelerContratSchema,
} = require('../validations/contrat.validation');

router.use(protect);

// GET /api/contrats - Admin/RH
router.get('/', authorize('admin', 'rh'), contratController.getAllContrats);

// GET /api/contrats/:id - Admin/RH
router.get('/:id', authorize('admin', 'rh'), validate(contratParamsSchema), contratController.getContratById);

// POST /api/contrats - Admin/RH
router.post('/', authorize('admin', 'rh'), validate(createContratSchema), contratController.createContrat);

// PUT /api/contrats/:id - Admin/RH
router.put('/:id', authorize('admin', 'rh'), validate(contratParamsSchema), validate(updateContratSchema), contratController.updateContrat);

// DELETE /api/contrats/:id - Admin
router.delete('/:id', authorize('admin'), validate(contratParamsSchema), contratController.deleteContrat);

// POST /api/contrats/:id/renouveler - Admin/RH
router.post('/:id/renouveler', authorize('admin', 'rh'), validate(renouvelerContratSchema), contratController.renouvelerContrat);

module.exports = router;
