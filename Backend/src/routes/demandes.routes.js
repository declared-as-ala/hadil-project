const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const demandeController = require('../controllers/demande.controller');
const {
  createDemandeSchema,
  updateDemandeSchema,
  demandeParamsSchema,
} = require('../validations/demande.validation');

router.use(protect);

// GET /api/demandes - Admin/RH/Employe
router.get('/', authorize('admin', 'rh', 'employe'), demandeController.getAllDemandes);

// GET /api/demandes/consult - Admin/RH (consult all)
router.get('/consult', authorize('admin', 'rh'), demandeController.consulterDemandes);

// GET /api/demandes/:id - Admin/RH
router.get('/:id', authorize('admin', 'rh'), validate(demandeParamsSchema), demandeController.getDemandeById);

// POST /api/demandes - Employe (can create own demande)
router.post('/', authorize('employe'), validate(createDemandeSchema), demandeController.createDemande);

// PUT /api/demandes/:id - Admin/RH (can update status/response)
router.put('/:id', authorize('admin', 'rh'), validate(demandeParamsSchema), validate(updateDemandeSchema), demandeController.updateDemande);

// DELETE /api/demandes/:id - Admin
router.delete('/:id', authorize('admin'), validate(demandeParamsSchema), demandeController.deleteDemande);

module.exports = router;
