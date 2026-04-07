const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const projetController = require('../controllers/projet.controller');
const {
  createProjetSchema,
  updateProjetSchema,
  projetParamsSchema,
  assignMemberSchema,
} = require('../validations/projet.validation');

router.use(protect);

// GET /api/projets - All authenticated
router.get('/', authorize('admin', 'rh', 'employe'), projetController.getAllProjets);

// GET /api/projets/:id
router.get('/:id', authorize('admin', 'rh', 'employe'), validate(projetParamsSchema), projetController.getProjetById);

// POST /api/projets - Admin only (Admin manages projects per UML)
router.post('/', authorize('admin'), validate(createProjetSchema), projetController.createProjet);

// PUT /api/projets/:id - Admin
router.put('/:id', authorize('admin'), validate(projetParamsSchema), validate(updateProjetSchema), projetController.updateProjet);

// DELETE /api/projets/:id - Admin
router.delete('/:id', authorize('admin'), validate(projetParamsSchema), projetController.deleteProjet);

// POST /api/projets/:id/members - Assign employee to project
router.post('/:id/members', authorize('admin'), validate(assignMemberSchema), projetController.assignMember);

// DELETE /api/projets/:id/members - Remove employee from project
router.delete('/:id/members', authorize('admin'), validate(assignMemberSchema), projetController.removeMember);

module.exports = router;
