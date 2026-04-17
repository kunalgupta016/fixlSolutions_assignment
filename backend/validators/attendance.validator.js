const { body, query } = require("express-validator");

const checkInValidator = [
  // For standard user check-in, the system date is used.
  // Optional date can be accepted if an admin is manually logging someone.
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      // Reset hours to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      inputDate.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        throw new Error("Cannot mark attendance for future dates");
      }
      return true;
    }),
];

const adminMarkValidator = [
  body("employeeId")
    .notEmpty()
    .withMessage("Employee ID is required")
    .isMongoId()
    .withMessage("Invalid Employee ID format"),
  
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Cannot mark attendance for future dates");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["present", "absent", "half_day", "on_leave", "holiday", "weekend"])
    .withMessage("Invalid status"),
];

const historyFilterValidator = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date")
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error("End date must be on or after start date");
      }
      return true;
    }),
];

module.exports = { checkInValidator, adminMarkValidator, historyFilterValidator };
