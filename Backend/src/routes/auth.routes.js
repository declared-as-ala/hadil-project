const express = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

const signupValidation = {
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
};

const loginValidation = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

router.post('/signup', validate(signupValidation), authController.signup);
router.post('/login', validate(loginValidation), authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;

