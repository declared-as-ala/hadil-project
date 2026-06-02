const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const tokenService = require('../services/token.service');
const User = require('../models/User.model');
const Employe = require('../models/Employe.model');

const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractTokenFromHeader(req);

  if (!token) {
    throw new ApiError(401, 'Authorization token missing or invalid');
  }

  try {
    const decoded = tokenService.verifyToken(token);

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    const userData = user.toJSON();
    
    // Get associated employee record if it exists
    const employe = await Employe.findOne({ utilisateur: user._id });
    userData.employeeId = employe ? employe._id : null;
    if (employe) {
      userData.nom = employe.nom;
      userData.prenom = employe.prenom;
      userData.fullName = userData.fullName || `${employe.prenom || ''} ${employe.nom || ''}`.trim();
    } else {
      userData.fullName = userData.fullName || (userData.role === 'admin' ? 'Administrateur' : 'User');
    }

    req.user = userData;

    return next();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(401, 'Invalid or expired token');
  }
});

/**
 * Role-based authorization middleware.
 * Usage: authorize('admin', 'rh') - allows only admin or rh
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    return next();
  };
};

module.exports = {
  protect,
  authorize,
};
