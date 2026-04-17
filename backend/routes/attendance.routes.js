const express = require("express");
const router = express.Router();

const {
  checkIn,
  checkOut,
  getMyHistory,
  getAllAttendance,
  adminMarkAttendance,
  getMonthlySummary,
  getOverallMonthlyReport,
} = require("../controllers/attendance.controller");

const {
  checkInValidator,
  adminMarkValidator,
  historyFilterValidator,
} = require("../validators/attendance.validator");

const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

// All attendance routes require authentication
router.use(authenticate);

// ── Employee Routes ──
router.post("/check-in", checkInValidator, validate, checkIn);
router.patch("/check-out", checkOut);
router.get("/me", historyFilterValidator, validate, getMyHistory);
router.get("/summary", getMonthlySummary);

// ── Admin/Manager Routes ──
router.get("/report", authorize("admin"), getOverallMonthlyReport);
router.get("/", authorize("admin", "manager"), getAllAttendance);
router.post(
  "/admin-mark",
  authorize("admin"),
  adminMarkValidator,
  validate,
  adminMarkAttendance
);

module.exports = router;
