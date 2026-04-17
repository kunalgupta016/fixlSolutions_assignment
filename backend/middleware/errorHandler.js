const ApiError = require("../utils/ApiError");

/**
 * Global error handling middleware.
 * Catches all errors thrown in routes/controllers and sends
 * a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err);
  }

  // ── Mongoose: Bad ObjectId ──
  if (err.name === "CastError") {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // ── Mongoose: Duplicate key ──
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`Duplicate value for '${field}'. This ${field} already exists.`);
  }

  // ── Mongoose: Validation error ──
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest("Validation failed", messages);
  }

  // ── JWT: Invalid token ──
  if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid token. Please log in again.");
  }

  // ── JWT: Expired token ──
  if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token expired. Please log in again.");
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
