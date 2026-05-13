const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const affectationController = require('../controllers/affectation.controller');

router.use(protect);

// IMPORTANT: specific routes before /:id
// POST /api/affectations/sync — auto-create from existing employee poste strings
router.post('/sync', authorize('admin', 'rh'), affectationController.syncFromEmployes);

// GET /api/affectations/employe/:employeId — current affectation for employee
router.get('/employe/:employeId', authorize('admin', 'rh', 'employe'), affectationController.getAffectationActuelle);

router.get('/', authorize('admin', 'rh'), affectationController.getAllAffectations);
router.get('/:id', authorize('admin', 'rh'), affectationController.getAffectationById);
router.post('/', authorize('admin', 'rh'), affectationController.createAffectation);
router.put('/:id', authorize('admin', 'rh'), affectationController.updateAffectation);
router.delete('/:id', authorize('admin', 'rh'), affectationController.deleteAffectation);

module.exports = router;
