const { Leave, User } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Helper to calculate total days
const calculateTotalDays = (startDate, endDate, isHalfDay) => {
  if (isHalfDay) return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * @desc    Apply for leave
 * @route   POST /api/leaves
 * @access  Private
 */
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, isHalfDay, halfDayPeriod, reason } = req.body;
  const employeeId = req.user._id;

  const requestedDays = calculateTotalDays(startDate, endDate, isHalfDay);

  // Check leave balance (unpaid leaves don't have a limit but we still track them)
  if (leaveType !== "unpaid") {
    const user = await User.findById(employeeId);
    if (user.leaveBalance[leaveType] < requestedDays) {
      throw ApiError.badRequest(
        `Insufficient ${leaveType} leave balance. Requested: ${requestedDays}, Available: ${user.leaveBalance[leaveType]}`
      );
    }
  }

  const leave = await Leave.create({
    employee: employeeId,
    leaveType,
    startDate,
    endDate,
    isHalfDay: isHalfDay || false,
    halfDayPeriod,
    reason,
    totalDays: requestedDays, // Manually setting although pre-save handles it too
  });

  return ApiResponse.created(res, { leave }, "Leave application submitted successfully");
});

/**
 * @desc    Get my leaves
 * @route   GET /api/leaves/me
 * @access  Private
 */
const getMyLeaves = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Leave.countDocuments({ employee: req.user._id });
  const leaves = await Leave.find({ employee: req.user._id })
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
    leaves 
  }, "Leaves retrieved successfully");
});

/**
 * @desc    Get all leaves (Admin/Manager)
 * @route   GET /api/leaves
 * @access  Private (Admin/Manager)
 */
const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, leaveType } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const filter = {};

  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;

  // If user is manager, potentially filter by manager's department or reportees.
  if (req.user.role === "manager") {
    const reportees = await User.find({ manager: req.user._id }).select("_id");
    filter.employee = { $in: reportees.map((u) => u._id) };
  }

  const total = await Leave.countDocuments(filter);
  const leaves = await Leave.find(filter)
    .populate("employee", "name email department avatar")
    .populate("approvedBy", "name")
    .sort({ appliedOn: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.ok(res, { 
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    leaves 
  }, "All leaves retrieved");
});

/**
 * @desc    Edit a pending leave
 * @route   PUT /api/leaves/:id
 * @access  Private
 */
const editLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound("Leave record not found");
  }

  if (leave.employee.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only edit your own leave applications");
  }

  if (leave.status !== "pending") {
    throw ApiError.badRequest(`Cannot edit leave because it is already ${leave.status}`);
  }

  const { leaveType, startDate, endDate, isHalfDay, halfDayPeriod, reason } = req.body;

  let newTotalDays = leave.totalDays;
  if (startDate || endDate || isHalfDay !== undefined) {
    const sDate = startDate || leave.startDate;
    const eDate = endDate || leave.endDate;
    const half = isHalfDay !== undefined ? isHalfDay : leave.isHalfDay;
    newTotalDays = calculateTotalDays(sDate, eDate, half);

    if (leaveType !== "unpaid" && leaveType) {
      const user = await User.findById(req.user._id);
      if (user.leaveBalance[leaveType] < newTotalDays) {
         throw ApiError.badRequest(
           `Insufficient ${leaveType} leave balance. Requested: ${newTotalDays}, Available: ${user.leaveBalance[leaveType]}`
         );
      }
    }
  }

  leave.leaveType = leaveType || leave.leaveType;
  leave.startDate = startDate || leave.startDate;
  leave.endDate = endDate || leave.endDate;
  leave.isHalfDay = isHalfDay !== undefined ? isHalfDay : leave.isHalfDay;
  leave.halfDayPeriod = halfDayPeriod || leave.halfDayPeriod;
  leave.reason = reason || leave.reason;
  leave.totalDays = newTotalDays;

  await leave.save();

  return ApiResponse.ok(res, { leave }, "Leave application updated successfully");
});

/**
 * @desc    Cancel a pending leave
 * @route   PATCH /api/leaves/:id/cancel
 * @access  Private
 */
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound("Leave record not found");
  }

  if (leave.employee.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only cancel your own leave applications");
  }

  if (leave.status !== "pending") {
    throw ApiError.badRequest(`Cannot cancel leave because it is already ${leave.status}`);
  }

  leave.status = "cancelled";
  leave.actionDate = Date.now();
  await leave.save();

  return ApiResponse.ok(res, { leave }, "Leave application cancelled successfully");
});

/**
 * @desc    Approve or Reject a leave application (Admin/Manager)
 * @route   PATCH /api/leaves/:id/action
 * @access  Private (Admin/Manager)
 */
const actionLeave = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound("Leave record not found");
  }

  if (leave.status !== "pending") {
    throw ApiError.badRequest(`Leave is already ${leave.status} and cannot be changed`);
  }

  const employee = await User.findById(leave.employee);

  if (status === "approved" && leave.leaveType !== "unpaid") {
    // Final balance check before approval
    if (employee.leaveBalance[leave.leaveType] < leave.totalDays) {
      throw ApiError.badRequest("Employee does not have sufficient leave balance to approve this request");
    }
    // Deduct balance
    employee.leaveBalance[leave.leaveType] -= leave.totalDays;
  } else if (status === "approved" && leave.leaveType === "unpaid") {
    // Increase unpaid tally
    employee.leaveBalance.unpaid += leave.totalDays;
  }

  leave.status = status;
  leave.approvedBy = req.user._id;
  leave.approverRemarks = remarks;
  leave.actionDate = Date.now();

  // We should ideally use transactions here to ensure both save or both fail
  // But for standard setup, we will save both.
  await employee.save({ validateBeforeSave: false }); // skip validators if other fields missing
  await leave.save();

  return ApiResponse.ok(res, { leave }, `Leave application has been ${status}`);
});

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  editLeave,
  cancelLeave,
  actionLeave,
};
