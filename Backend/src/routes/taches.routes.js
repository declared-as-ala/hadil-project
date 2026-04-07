const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const tacheController = require('../controllers/tache.controller');
const {
  createTacheSchema,
  updateTacheSchema,
  tacheParamsSchema,
} = require('../validations/tache.validation');

router.use(protect);

// GET /api/taches - All authenticated
router.get('/', authorize('admin', 'rh', 'employe'), tacheController.getAllTaches);

// GET /api/taches/:id
router.get('/:id', authorize('admin', 'rh', 'employe'), validate(tacheParamsSchema), tacheController.getTacheById);

// POST /api/taches - Admin/RH
router.post('/', authorize('admin', 'rh'), validate(createTacheSchema), tacheController.createTache);

// PUT /api/taches/:id - Admin/RH
router.put('/:id', authorize('admin', 'rh'), validate(tacheParamsSchema), validate(updateTacheSchema), tacheController.updateTache);

// DELETE /api/taches/:id - Admin
router.delete('/:id', authorize('admin'), validate(tacheParamsSchema), tacheController.deleteTache);

// PUT /api/taches/:id/assign-project - Assign task to project
router.put('/:id/assign-project', authorize('admin', 'rh'), validate(tacheParamsSchema), tacheController.assignTacheToProject);

module.exports = router;
