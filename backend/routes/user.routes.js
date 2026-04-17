const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  updateLeaveBalance,
  updateProfile,
} = require("../controllers/user.controller");

const { authenticate, authorize } = require("../middleware/auth");

// All user management routes require authentication
router.use(authenticate);

// ── Shared (Admin & Manager) ──
// Managers need to see users to manage leaves/attendance
router.get("/", authorize("admin", "manager"), getAllUsers);
router.get("/:id", authorize("admin", "manager"), getUserById);

// ── Self Management (Any logged-in Employee/Admin) ──
router.patch("/profile", updateProfile);

// ── Admin Only ──
// Only admins can change roles, deactivate accounts or forcibly edit leave balances
router.put("/:id", authorize("admin"), updateUser);
router.patch("/:id/leave-balance", authorize("admin"), updateLeaveBalance);

module.exports = router;
