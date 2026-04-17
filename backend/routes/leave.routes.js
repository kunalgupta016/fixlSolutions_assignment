const express = require("express");
const router = express.Router();

const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  editLeave,
  cancelLeave,
  actionLeave,
} = require("../controllers/leave.controller");

const { applyLeaveValidator, actionLeaveValidator } = require("../validators/leave.validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

// All leave routes require authentication
router.use(authenticate);

// ── Employee Routes ──
router.post("/", applyLeaveValidator, validate, applyLeave);
router.get("/me", getMyLeaves);
router.put("/:id", applyLeaveValidator, validate, editLeave);
router.patch("/:id/cancel", cancelLeave);

// ── Admin/Manager Routes ──
router.get("/", authorize("admin", "manager"), getAllLeaves);
router.patch(
  "/:id/action",
  authorize("admin", "manager"),
  actionLeaveValidator,
  validate,
  actionLeave
);

module.exports = router;
