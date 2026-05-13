const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');
const tokenService = require('./token.service');

const SALT_ROUNDS = 10;

/**
 * Build the public user payload returned after login.
 * Includes the linked employeeId (if any) so the frontend and middleware
 * can attach it to req.user.
 */
const buildPublicUser = async (user) => {
  const userData = user.toJSON();
  const employe = await Employe.findOne({ utilisateur: user._id });
  userData.employeeId = employe ? employe._id : null;
  return userData;
};

const loginUser = async ({ email, password }) => {
  const INVALID_MESSAGE = 'Invalid email or password';

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, INVALID_MESSAGE);
  }

  const isMatch = await user.isPasswordMatch(password);

  if (!isMatch) {
    throw new ApiError(401, INVALID_MESSAGE);
  }

  const accessToken = tokenService.generateAccessToken(user);

  return {
    user: await buildPublicUser(user),
    accessToken,
  };
};

module.exports = {
  loginUser,
};
