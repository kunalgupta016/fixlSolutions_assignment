const { body } = require("express-validator");

const applyLeaveValidator = [
  body("leaveType")
    .trim()
    .notEmpty()
    .withMessage("Leave type is required")
    .isIn(["casual", "sick", "earned", "unpaid"])
    .withMessage("Invalid leave type"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error("End date must be on or after start date");
      }
      return true;
    }),

  body("isHalfDay").optional().isBoolean().withMessage("isHalfDay must be boolean"),

  body("halfDayPeriod")
    .if(body("isHalfDay").equals("true"))
    .notEmpty()
    .withMessage("Half day period is required for half day leave")
    .isIn(["first_half", "second_half"])
    .withMessage("Invalid half day period"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10 and 500 characters"),
];

const actionLeaveValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be either approved or rejected"),

  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Remarks cannot exceed 300 characters"),
];

module.exports = { applyLeaveValidator, actionLeaveValidator };
