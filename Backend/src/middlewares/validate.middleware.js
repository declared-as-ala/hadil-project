const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Validate request using Zod schemas.
 * Schema shape: { body?, query?, params? }
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }

    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(new ApiError(400, 'Validation error', err.errors));
    }

    return next(err);
  }
};

module.exports = validate;

