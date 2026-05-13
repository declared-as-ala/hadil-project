const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const paieController = require('../controllers/paie.controller');

router.use(protect);

// Specific routes before /:id
router.get('/mes-paies', authorize('admin', 'rh', 'employe'), paieController.getMesPaies);
router.get('/document', authorize('admin', 'rh', 'employe'), paieController.getPaieDocument);
router.get('/calculer', authorize('admin', 'rh'), paieController.calculerSalaire);
router.post('/generer', authorize('admin', 'rh'), paieController.genererPaie);
router.post('/generer-toutes', authorize('admin', 'rh'), paieController.genererToutesPaies);

router.get('/', authorize('admin', 'rh'), paieController.getAllPaies);
router.get('/:id', authorize('admin', 'rh', 'employe'), paieController.getPaieById);
router.delete('/:id', authorize('admin'), paieController.deletePaie);

module.exports = router;
