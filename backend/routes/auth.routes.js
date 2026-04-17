const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/auth.controller");

const { registerValidator, loginValidator } = require("../validators/auth.validator");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

// ── Public Routes ──
router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);

// ── Protected Routes (require authentication) ──
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

module.exports = router;
