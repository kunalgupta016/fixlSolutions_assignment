const { Attendance, User } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Utility to get start and end of a specific day
const getDayRange = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date.setUTCHours(0, 0, 0, 0));
  const end = new Date(date.setUTCHours(23, 59, 59, 999));
  return { start, end };
};

/**
 * @desc    Check-In for the day
 * @route   POST /api/attendance/check-in
 * @access  Private
 */
const checkIn = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { start, end } = getDayRange(); // Today

  // Ensure user hasn't already checked in today
  const existingRecord = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  });

  if (existingRecord) {
    throw ApiError.badRequest("You have already checked in today. Only one check-in per day is allowed.");
  }

  const attendance = await Attendance.create({
    employee: employeeId,
    date: new Date(),
    checkIn: {
      time: new Date(),
      ip: req.ip || req.connection.remoteAddress,
    },
    markedBy: "self",
  });

  return ApiResponse.created(res, { attendance }, "Checked in successfully");
});

/**
 * @desc    Check-Out for the day
 * @route   PATCH /api/attendance/check-out
 * @access  Private
 */
const checkOut = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { start, end } = getDayRange();

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  });

  if (!attendance) {
    throw ApiError.badRequest("You have not checked in today.");
  }

  if (attendance.checkOut && attendance.checkOut.time) {
    throw ApiError.badRequest("You have already checked out today.");
  }

  attendance.checkOut = {
    time: new Date(),
    ip: req.ip || req.connection.remoteAddress,
  };

  // The pre-save hook in the Model automatically calculates hours, status, overtime, etc.
  await attendance.save();

  return ApiResponse.ok(res, { attendance }, "Checked out successfully");
});

/**
 * @desc    Get logged-in user's attendance history
 * @route   GET /api/attendance/me
 * @access  Private
 */
const getMyHistory = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { startDate, endDate } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const filter = { employee: employeeId };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const { end } = getDayRange(endDate);
      filter.date.$lte = end;
    }
  }

  const total = await Attendance.countDocuments(filter);
  const history = await Attendance.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.ok(res, { 
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    history 
  }, "Attendance history retrieved");
});

/**
 * @desc    Admin: Get all attendance (filter by date and employee)
 * @route   GET /api/attendance
 * @access  Private (Admin/Manager)
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  const { date, employeeId, startDate, endDate, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  if (employeeId) filter.employee = employeeId;

  if (date) {
    const { start, end } = getDayRange(date);
    filter.date = { $gte: start, $lte: end };
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const { end } = getDayRange(endDate);
      filter.date.$lte = end;
    }
  }

  // Search by employee name via sub-query if searching
  if (search) {
    const matchingUsers = await User.find({ 
      name: { $regex: search, $options: "i" } 
    }).select("_id");
    filter.employee = { $in: matchingUsers.map(u => u._id) };
  }

  const total = await Attendance.countDocuments(filter);
  const attendances = await Attendance.find(filter)
    .populate("employee", "name email department role avatar")
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.ok(res, { 
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    attendances 
  }, "Attendance retrieved");
});

/**
 * @desc    Admin: Manually mark attendance for an employee
 * @route   POST /api/attendance/admin-mark
 * @access  Private (Admin)
 */
const adminMarkAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, checkInTime, checkOutTime, status, notes } = req.body;

  const targetDate = new Date(date);
  const { start, end } = getDayRange(date);

  // Check if a record already exists for this day
  let record = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  });

  if (record) {
    // Admin is updating an existing record
    if (checkInTime) record.checkIn.time = new Date(checkInTime);
    if (checkOutTime) record.checkOut.time = new Date(checkOutTime);
    if (status) record.status = status;
    if (notes) record.notes = notes;
    record.markedBy = "admin";
    await record.save();

    return ApiResponse.ok(res, { attendance: record }, "Attendance record updated");
  } else {
    // Admin is creating a new record
    record = await Attendance.create({
      employee: employeeId,
      date: targetDate,
      checkIn: checkInTime ? { time: new Date(checkInTime), ip: "mapped-by-admin" } : undefined,
      checkOut: checkOutTime ? { time: new Date(checkOutTime), ip: "mapped-by-admin" } : undefined,
      status: status || "present",
      notes: notes || "Manually marked by admin",
      markedBy: "admin",
    });

    return ApiResponse.created(res, { attendance: record }, "Attendance record created");
  }
});

/**
 * @desc    Get monthly summary for logged in user (or specify month)
 * @route   GET /api/attendance/summary
 * @access  Private
 */
const getMonthlySummary = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  // Using the static method defined on our Model
  const data = await Attendance.getMonthlySummary(employeeId, month, year);

  return ApiResponse.ok(res, data, `Summary for ${month}/${year}`);
});

/**
 * @desc    Admin: Get monthly report for all employees
 * @route   GET /api/attendance/report
 * @access  Private (Admin)
 */
const getOverallMonthlyReport = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all active employees
  const employees = await User.find({ role: "employee", isActive: true }).select("name email department");

  // Get all attendance records for this month
  const records = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  });

  const report = employees.map(emp => {
    const empRecords = records.filter(r => r.employee.toString() === emp._id.toString());
    
    const summary = {
      totalDays: empRecords.length,
      present: 0,
      absent: 0,
      halfDay: 0,
      onLeave: 0,
      holidays: 0,
      weekends: 0,
      totalWorkHours: 0,
      totalOvertime: 0,
      lateArrivals: 0,
      earlyDepartures: 0,
    };

    empRecords.forEach((record) => {
      summary[record.status === "half_day" ? "halfDay" : record.status === "on_leave" ? "onLeave" : record.status] += 1;
      summary.totalWorkHours += record.workHours || 0;
      summary.totalOvertime += record.overtime || 0;
      if (record.isLateArrival) summary.lateArrivals += 1;
      if (record.isEarlyDeparture) summary.earlyDepartures += 1;
    });

    summary.totalWorkHours = parseFloat(summary.totalWorkHours.toFixed(2));
    summary.totalOvertime = parseFloat(summary.totalOvertime.toFixed(2));

    return {
      employee: emp,
      ...summary
    };
  });

  return ApiResponse.ok(res, { month, year, report }, `Monthly report for ${month}/${year}`);
});

module.exports = {
  checkIn,
  checkOut,
  getMyHistory,
  getAllAttendance,
  adminMarkAttendance,
  getMonthlySummary,
  getOverallMonthlyReport,
};
