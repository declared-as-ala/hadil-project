const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const posteController = require('../controllers/poste.controller');

router.use(protect);
router.get('/', authorize('admin', 'rh', 'employe'), posteController.getAllPostes);
router.get('/:id', authorize('admin', 'rh'), posteController.getPosteById);
router.post('/', authorize('admin', 'rh'), posteController.createPoste);
router.put('/:id', authorize('admin', 'rh'), posteController.updatePoste);
router.delete('/:id', authorize('admin'), posteController.deletePoste);

module.exports = router;
