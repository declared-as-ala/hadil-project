const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, 'Route not found'));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = 'Internal server error';
    let errors = null;

    // Mongoose validation error
    if (error instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      message = 'Validation error';
      errors = Object.values(error.errors).map((e) => ({
        path: e.path,
        message: e.message,
      }));
    }

    // Mongoose cast error (invalid ObjectId)
    if (error instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = 'Invalid identifier';
    }

    // Duplicate key error
    if (error.code && error.code === 11000) {
      statusCode = 409;
      const fields = Object.keys(error.keyPattern || error.keyValue || {});
      message = `Duplicate value for field(s): ${fields.join(', ')}`;
    }

    error = new ApiError(statusCode, message, errors || null);
  }

  const response = {
    success: false,
    message: error.message,
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

