const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const employeController = require('../controllers/employe.controller');
const {
  createEmployeSchema,
  updateEmployeSchema,
  employeParamsSchema,
} = require('../validations/employe.validation');

// All routes protected
router.use(protect);

// GET /api/employes - Admin/RH/Employe (Directory access)
router.get('/', authorize('admin', 'rh', 'employe'), employeController.getAllEmployes);

// GET /api/employes/:id - Admin/RH/Employe
router.get('/:id', authorize('admin', 'rh', 'employe'), validate(employeParamsSchema), employeController.getEmployeById);

// POST /api/employes - Admin/RH only
router.post('/', authorize('admin', 'rh'), validate(createEmployeSchema), employeController.createEmploye);

// PUT /api/employes/:id - Admin/RH only
router.put('/:id', authorize('admin', 'rh'), validate(employeParamsSchema), validate(updateEmployeSchema), employeController.updateEmploye);

// DELETE /api/employes/:id - Admin only
router.delete('/:id', authorize('admin'), validate(employeParamsSchema), employeController.deleteEmploye);

module.exports = router;
