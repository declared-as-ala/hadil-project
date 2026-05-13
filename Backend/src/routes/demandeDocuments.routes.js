const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const ctrl = require('../controllers/demandeDocument.controller');
const {
  createDemandeDocumentSchema,
  updateStatutDemandeDocumentSchema,
  demandeDocumentParamsSchema,
} = require('../validations/demandeDocument.validation');

router.use(protect);

// Employee: GET own requests
router.get('/mes-demandes', authorize('employe', 'stagiaire'), ctrl.getMesDemandes);

// Admin / RH: GET all requests (with optional ?status= / ?employeId= filters)
router.get('/', authorize('admin', 'rh'), ctrl.getAllDemandes);

// Employee: POST create request
router.post('/', authorize('employe', 'stagiaire'), validate(createDemandeDocumentSchema), ctrl.createDemande);

// Admin / RH: PUT update status
router.put(
  '/:id/statut',
  authorize('admin', 'rh'),
  validate(demandeDocumentParamsSchema),
  validate(updateStatutDemandeDocumentSchema),
  ctrl.updateStatut
);

// Admin: DELETE any request
router.delete('/:id', authorize('admin', 'rh'), validate(demandeDocumentParamsSchema), ctrl.deleteDemande);

// Employee: DELETE own request (only if still 'en_attente')
router.delete('/mes-demandes/:id', authorize('employe', 'stagiaire'), validate(demandeDocumentParamsSchema), ctrl.deleteMaDemande);

module.exports = router;
