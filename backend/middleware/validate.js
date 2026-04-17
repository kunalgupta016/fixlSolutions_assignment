const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Middleware that checks express-validator results.
 * If validation fails, throws a structured ApiError with all messages.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw ApiError.badRequest("Validation failed", messages);
  }
  next();
};

module.exports = validate;
