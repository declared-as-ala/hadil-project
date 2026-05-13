const express = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

const loginValidation = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

// Login — employees use credentials created by the Admin
router.post('/login', validate(loginValidation), authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
