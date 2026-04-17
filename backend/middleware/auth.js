const { verifyToken } = require("../utils/jwt");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Authentication middleware.
 * Extracts JWT from Authorization header or cookies,
 * verifies it, and attaches the user to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header first (Bearer <token>)
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Fallback: check cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized("Authentication required. Please log in.");
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated. Contact HR.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized("Invalid or expired token");
  }
});

/**
 * Role-based authorization middleware.
 * Restricts access to specific roles.
 * @param  {...string} roles - Allowed roles (e.g., "admin", "manager")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' does not have permission to access this resource`
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
