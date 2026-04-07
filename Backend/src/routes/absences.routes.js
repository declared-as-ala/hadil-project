const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const absenceController = require('../controllers/absence.controller');
const {
  createAbsenceSchema,
  updateAbsenceSchema,
  absenceParamsSchema,
} = require('../validations/absence.validation');

router.use(protect);

// GET /api/absences - Admin/RH/Employe
router.get('/', authorize('admin', 'rh', 'employe'), absenceController.getAllAbsences);

// GET /api/absences/:id - Admin/RH
router.get('/:id', authorize('admin', 'rh'), validate(absenceParamsSchema), absenceController.getAbsenceById);

// POST /api/absences - Admin/RH
router.post('/', authorize('admin', 'rh'), validate(createAbsenceSchema), absenceController.createAbsence);

// PUT /api/absences/:id - Admin/RH
router.put('/:id', authorize('admin', 'rh'), validate(absenceParamsSchema), validate(updateAbsenceSchema), absenceController.updateAbsence);

// DELETE /api/absences/:id - Admin
router.delete('/:id', authorize('admin'), validate(absenceParamsSchema), absenceController.deleteAbsence);

module.exports = router;
