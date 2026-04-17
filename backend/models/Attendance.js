const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    checkIn: {
      time: { type: Date, default: null },
      ip: { type: String, default: "" },
    },
    checkOut: {
      time: { type: Date, default: null },
      ip: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: {
        values: ["present", "absent", "half_day", "on_leave", "holiday", "weekend"],
        message: "{VALUE} is not a valid attendance status",
      },
      default: "absent",
    },
    workHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, "Notes cannot exceed 200 characters"],
      default: "",
    },
    isLateArrival: {
      type: Boolean,
      default: false,
    },
    isEarlyDeparture: {
      type: Boolean,
      default: false,
    },
    markedBy: {
      type: String,
      enum: ["self", "admin", "system"],
      default: "self",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound index: one attendance record per employee per day ──
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ employee: 1, status: 1 });

// ── Auto-calculate workHours & overtime on checkout ──
attendanceSchema.pre("save", function () {
  // If they have checked in but not checked out yet, optimistically mark as present.
  if (this.checkIn?.time && !this.checkOut?.time) {
    this.status = "present";
    return;
  }

  if (!this.checkIn?.time || !this.checkOut?.time) return;

  const diffMs = this.checkOut.time - this.checkIn.time;
  const hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

  this.workHours = Math.min(hours, 24);

  const STANDARD_HOURS = 8;

  this.overtime =
    hours > STANDARD_HOURS
      ? parseFloat((hours - STANDARD_HOURS).toFixed(2))
      : 0;

  // ⚠️ Timezone issue fix (IMPORTANT)
  const checkInHour = this.checkIn.time.getHours();
  const checkInMin = this.checkIn.time.getMinutes();

  this.isLateArrival =
    checkInHour > 9 || (checkInHour === 9 && checkInMin > 30);

  const checkOutHour = this.checkOut.time.getHours();
  const checkOutMin = this.checkOut.time.getMinutes();

  this.isEarlyDeparture =
    checkOutHour < 17 || (checkOutHour === 17 && checkOutMin < 30);

  // Status logic
  if (this.workHours >= 4 && this.workHours < 6) {
    this.status = "half_day";
  } else if (this.workHours >= 6 || this.workHours > 0) {
    // If they worked any time at all, they are "present" (though potentially with early departure flag)
    this.status = "present";
  } else {
    this.status = "absent";
  }
});

// ── Virtual: formatted work duration ──
attendanceSchema.virtual("workDuration").get(function () {
  if (!this.workHours) return "0h 0m";
  const hours = Math.floor(this.workHours);
  const minutes = Math.round((this.workHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// ── Static: Get monthly summary for an employee ──
attendanceSchema.statics.getMonthlySummary = async function (employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await this.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const summary = {
    totalDays: records.length,
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

  records.forEach((record) => {
    summary[record.status === "half_day" ? "halfDay" : record.status === "on_leave" ? "onLeave" : record.status] += 1;
    summary.totalWorkHours += record.workHours || 0;
    summary.totalOvertime += record.overtime || 0;
    if (record.isLateArrival) summary.lateArrivals += 1;
    if (record.isEarlyDeparture) summary.earlyDepartures += 1;
  });

  summary.totalWorkHours = parseFloat(summary.totalWorkHours.toFixed(2));
  summary.totalOvertime = parseFloat(summary.totalOvertime.toFixed(2));

  return { summary, records };
};

module.exports = mongoose.model("Attendance", attendanceSchema);
