const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const userController = require('../controllers/user.controller');
const { updateRoleSchema, userParamsSchema } = require('../validations/user.validation');

// Self-service profile routes (any authenticated user)
router.get('/me', protect, userController.getMe);
router.put('/me', protect, userController.updateMe);

// All routes below: admin only
router.use(protect);
router.use(authorize('admin'));

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', validate(userParamsSchema), userController.getUserById);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', validate(updateRoleSchema), userController.updateUserRole);

// DELETE /api/users/:id - Delete user
router.delete('/:id', validate(userParamsSchema), userController.deleteUser);

module.exports = router;
