const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateAccessToken = (user) => {
  const payload = {
    sub: user.id || user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const verifyToken = (token) => jwt.verify(token, config.jwt.secret);

module.exports = {
  generateAccessToken,
  verifyToken,
};

