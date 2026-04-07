const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const stagiaireController = require('../controllers/stagiaire.controller');
const {
  createStagiaireSchema,
  updateStagiaireSchema,
  stagiaireParamsSchema,
} = require('../validations/stagiaire.validation');

router.use(protect);

// GET /api/stagiaires - Admin/RH
router.get('/', authorize('admin', 'rh'), stagiaireController.getAllStagiaires);

// GET /api/stagiaires/:id - Admin/RH
router.get('/:id', authorize('admin', 'rh'), validate(stagiaireParamsSchema), stagiaireController.getStagiaireById);

// POST /api/stagiaires - Admin/RH
router.post('/', authorize('admin', 'rh'), validate(createStagiaireSchema), stagiaireController.createStagiaire);

// PUT /api/stagiaires/:id - Admin/RH
router.put('/:id', authorize('admin', 'rh'), validate(stagiaireParamsSchema), validate(updateStagiaireSchema), stagiaireController.updateStagiaire);

// DELETE /api/stagiaires/:id - Admin
router.delete('/:id', authorize('admin'), validate(stagiaireParamsSchema), stagiaireController.deleteStagiaire);

// POST /api/stagiaires/:stagiaireId/encadrant - Admin/RH
router.post('/:stagiaireId/encadrant', authorize('admin', 'rh'), stagiaireController.assignEncadrant);

// POST /api/stagiaires/:stagiaireId/assistance - Stagiaire
router.post('/:stagiaireId/assistance', authorize('stagiaire'), stagiaireController.demanderAssistance);

// PUT /api/stagiaires/:stagiaireId/sujet - Admin/RH
router.put('/:stagiaireId/sujet', authorize('admin', 'rh'), stagiaireController.gererSujetDeStage);

module.exports = router;
