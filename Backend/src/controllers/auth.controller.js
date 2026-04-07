const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  const result = await authService.registerUser({ fullName, email, password });

  res.status(201).json({
    success: true,
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser({ email, password });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  signup,
  login,
  getMe,
};

