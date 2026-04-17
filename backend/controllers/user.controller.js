const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Get all users (Employees)
 * @route   GET /api/users
 * @access  Private (Admin/Manager)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { department, role, isActive, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = {};

  if (department) filter.department = department;
  
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }
  
  // If no specific role is queried, systematically hide 'admin' accounts from employee lists
  if (role) {
    filter.role = role;
  } else {
    filter.role = { $ne: "admin" };
  }
  
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .populate("manager", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.ok(res, { 
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    users 
  }, "Users retrieved successfully");
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin/Manager)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("manager", "name email department");

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return ApiResponse.ok(res, { user }, "User retrieved successfully");
});

/**
 * @desc    Admin update user details (role, department, active status, manager)
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { role, department, isActive, manager, name, phone } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Prevent admin from deactivating themselves carelessly
  if (req.user._id.toString() === user._id.toString() && isActive === false) {
    throw ApiError.badRequest("You cannot deactivate your own admin account");
  }

  if (role) user.role = role;
  if (department) user.department = department;
  if (isActive !== undefined) user.isActive = isActive;
  if (manager !== undefined) user.manager = manager;
  if (name) user.name = name;
  if (phone) user.phone = phone;

  await user.save();

  return ApiResponse.ok(res, { user }, "User updated successfully");
});

/**
 * @desc    Manually override a user's leave balance
 * @route   PATCH /api/users/:id/leave-balance
 * @access  Private (Admin)
 */
const updateLeaveBalance = asyncHandler(async (req, res) => {
  const { casual, sick, earned, unpaid } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (casual !== undefined) user.leaveBalance.casual = casual;
  if (sick !== undefined) user.leaveBalance.sick = sick;
  if (earned !== undefined) user.leaveBalance.earned = earned;
  if (unpaid !== undefined) user.leaveBalance.unpaid = unpaid;

  await user.save();

  return ApiResponse.ok(res, { leaveBalance: user.leaveBalance }, "Leave balance manually updated");
});

/**
 * @desc    Employee/User updates their own profile (e.g. avatar)
 * @route   PATCH /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  return ApiResponse.ok(res, { user: user.toSafeObject() }, "Profile updated successfully");
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateLeaveBalance,
  updateProfile,
};
