const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const heureSupplementaireController = require('../controllers/heureSupplementaire.controller');
const {
  createHeureSupplementaireSchema,
  updateHeureSupplementaireSchema,
  heureSupplementaireParamsSchema,
} = require('../validations/heureSupplementaire.validation');

router.use(protect);

// GET /api/heures-supplementaires - Admin/RH/Employe
router.get('/', authorize('admin', 'rh', 'employe'), heureSupplementaireController.getAllHeuresSupplementaires);

// GET /api/heures-supplementaires/:id - Admin/RH
router.get('/:id', authorize('admin', 'rh'), validate(heureSupplementaireParamsSchema), heureSupplementaireController.getHeureSupplementaireById);

// POST /api/heures-supplementaires - Admin/RH
router.post('/', authorize('admin', 'rh'), validate(createHeureSupplementaireSchema), heureSupplementaireController.createHeureSupplementaire);

// PUT /api/heures-supplementaires/:id - Admin/RH
router.put('/:id', authorize('admin', 'rh'), validate(heureSupplementaireParamsSchema), validate(updateHeureSupplementaireSchema), heureSupplementaireController.updateHeureSupplementaire);

// DELETE /api/heures-supplementaires/:id - Admin
router.delete('/:id', authorize('admin'), validate(heureSupplementaireParamsSchema), heureSupplementaireController.deleteHeureSupplementaire);

module.exports = router;
