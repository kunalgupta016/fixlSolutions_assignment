const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken } = require("../utils/jwt");

// ── Cookie options for JWT token ──
const getCookieOptions = () => ({
  httpOnly: true, // Prevent XSS — JS can't access cookie
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  // Create user (password hashing happens in pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
    department,
    role: role || "employee",
    phone,
  });

  // Generate JWT
  const token = generateToken(user);

  // Set token in cookie
  res.cookie("token", token, getCookieOptions());

  // Return user without password
  const safeUser = user.toSafeObject();

  return res.status(201).json({
    success: true,
    statusCode: 201,
    message: "Registration successful",
    data: {
      user: safeUser,
      token,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly include password (excluded by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Check if account is active
  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated. Contact HR.");
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Generate JWT
  const token = generateToken(user);

  // Set token in cookie
  res.cookie("token", token, getCookieOptions());

  // Return user without password
  const safeUser = user.toSafeObject();

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Login successful",
    data: {
      user: safeUser,
      token,
    },
  });
});

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    ...getCookieOptions(),
    expires: new Date(0), // Expire immediately
  });

  return ApiResponse.ok(res, null, "Logged out successfully");
});

/**
 * @desc    Get currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by authenticate middleware
  const user = await User.findById(req.user._id).populate("manager", "name email department");

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return ApiResponse.ok(res, { user }, "Profile fetched successfully");
});

/**
 * @desc    Update own profile (name, phone, avatar)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Only allow updating specific fields (not role, email, department)
  const allowedFields = ["name", "phone", "avatar"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest("No valid fields to update");
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return ApiResponse.ok(res, { user }, "Profile updated successfully");
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest("Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw ApiError.badRequest("New password must be at least 6 characters");
  }

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Verify current password
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  // Update password (hashing happens in pre-save hook)
  user.password = newPassword;
  await user.save();

  // Generate new token with updated credentials
  const token = generateToken(user);
  res.cookie("token", token, getCookieOptions());

  return ApiResponse.ok(res, { token }, "Password changed successfully");
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
