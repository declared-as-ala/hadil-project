const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const tokenService = require('./token.service');

const SALT_ROUNDS = 10;

const buildPublicUser = (user) => user.toJSON();

const registerUser = async ({ fullName, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    throw new ApiError(409, 'Email is already in use');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
  });

  const accessToken = tokenService.generateAccessToken(user);

  return {
    user: buildPublicUser(user),
    accessToken,
  };
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
    user: buildPublicUser(user),
    accessToken,
  };
};

module.exports = {
  registerUser,
  loginUser,
};

