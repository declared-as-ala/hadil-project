const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const Employe = require('../models/Employe.model');
const bcrypt = require('bcryptjs');

const buildPublicUser = async (user) => {
  const userData = user.toJSON();
  const employe = await Employe.findOne({ utilisateur: user._id });
  userData.employeeId = employe ? employe._id : null;
  return userData;
};

/**
 * Update user role (admin only)
 * @param {string} userId - User ID to update
 * @param {string} role - New role (admin, rh, employe, stagiaire)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { role } = req.body;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent admin from changing their own role
  if (req.user.id === userId && role !== req.user.role) {
    throw new ApiError(403, 'You cannot change your own role');
  }

  // Update role
  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: {
      user: await buildPublicUser(user),
    },
  });
});

/**
 * Get all users (admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash');
  const usersWithEmployeeId = await Promise.all(
    users.map(async (user) => buildPublicUser(user))
  );

  res.status(200).json({
    success: true,
    data: {
      users: usersWithEmployeeId,
      count: usersWithEmployeeId.length,
    },
  });
});

/**
 * Get user by ID (admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: {
      user: await buildPublicUser(user),
    },
  });
});

/**
 * Delete user (admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;

  // Prevent admin from deleting themselves
  if (req.user.id === userId) {
    throw new ApiError(403, 'You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * Get current authenticated user's profile
 * GET /api/users/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: {
      user: await buildPublicUser(user),
    },
  });
});

/**
 * Update current authenticated user's profile
 * PUT /api/users/me
 */
const updateMe = asyncHandler(async (req, res) => {
  const { fullName, email, password, matricule, avatar } = req.body;

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Build update payload
  const setFields   = {};
  const unsetFields = {};

  // ── Full name
  if (fullName && fullName.trim()) {
    setFields.fullName = fullName.trim();
  }

  // ── Email uniqueness check
  if (email && email.trim() !== user.email) {
    const existing = await User.findOne({ email: email.trim(), _id: { $ne: user._id } });
    if (existing) {
      throw new ApiError(400, 'Email is already in use by another account');
    }
    setFields.email = email.trim();
  }

  // ── Matricule (User ID): must be exactly 8 digits if provided
  if (matricule !== undefined) {
    const mat = String(matricule).trim();
    if (mat === '') {
      // Clear the field
      unsetFields.matricule = '';
    } else {
      if (!/^\d{8}$/.test(mat)) {
        throw new ApiError(400, 'User ID must be exactly 8 digits (numbers only)');
      }
      // Uniqueness check
      const existing = await User.findOne({ matricule: mat, _id: { $ne: user._id } });
      if (existing) {
        throw new ApiError(400, 'This User ID is already taken by another account');
      }
      setFields.matricule = mat;
    }
  }

  // ── Password
  if (password) {
    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }
    setFields.passwordHash = await bcrypt.hash(password, 12);
  }

  // ── Avatar
  if (avatar !== undefined) {
    if (avatar.trim() === '') {
      unsetFields.avatar = '';
    } else {
      setFields.avatar = avatar;
    }
  }

  // Build the mongo update object
  const mongoUpdate = {};
  if (Object.keys(setFields).length)   mongoUpdate.$set   = setFields;
  if (Object.keys(unsetFields).length) mongoUpdate.$unset = unsetFields;

  // Nothing to update
  if (!Object.keys(mongoUpdate).length) {
    return res.status(200).json({
      success: true,
      message: 'No changes to save',
      data: { user: await buildPublicUser(user) },
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    mongoUpdate,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: await buildPublicUser(updatedUser),
    },
  });
});

module.exports = {
  updateUserRole,
  getAllUsers,
  getUserById,
  deleteUser,
  getMe,
  updateMe,
};
