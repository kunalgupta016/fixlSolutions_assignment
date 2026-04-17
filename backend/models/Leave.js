const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
      index: true,
    },
    leaveType: {
      type: String,
      required: [true, "Leave type is required"],
      enum: {
        values: ["casual", "sick", "earned", "unpaid"],
        message: "{VALUE} is not a valid leave type",
      },
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    totalDays: {
      type: Number,
      required: true,
      min: [0.5, "Minimum leave is half day"],
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayPeriod: {
      type: String,
      enum: ["first_half", "second_half"],
      default: null,
    },
    reason: {
      type: String,
      required: [true, "Reason for leave is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters"],
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approverRemarks: {
      type: String,
      trim: true,
      maxlength: [300, "Remarks cannot exceed 300 characters"],
      default: "",
    },
    appliedOn: {
      type: Date,
      default: Date.now,
    },
    actionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes for common queries ──
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1 });

// ── Validate: endDate must be >= startDate ──
leaveSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be on or after start date");
  }

  if (this.isHalfDay && this.startDate && this.endDate) {
    if (this.startDate.getTime() !== this.endDate.getTime()) {
      this.invalidate("endDate", "Half day leave must be on a single date");
    }

    if (!this.halfDayPeriod) {
      this.invalidate(
        "halfDayPeriod",
        "Half day period is required for half day leave"
      );
    }
  }
});

// ── Auto-calculate totalDays before saving ──
leaveSchema.pre("save", function () {
  if (this.isHalfDay) {
    this.totalDays = 0.5;
  } else if (this.isModified("startDate") || this.isModified("endDate")) {
    const diffTime = this.endDate - this.startDate;
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
});

// ── Virtual: human-readable status label ──
leaveSchema.virtual("statusLabel").get(function () {
  const labels = {
    pending: "⏳ Pending",
    approved: "✅ Approved",
    rejected: "❌ Rejected",
    cancelled: "🚫 Cancelled",
  };
  return labels[this.status] || this.status;
});

module.exports = mongoose.model("Leave", leaveSchema);
